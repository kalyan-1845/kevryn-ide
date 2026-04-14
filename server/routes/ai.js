const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const File = require('../File');
const ChatSession = require('../models/ChatSession');
const { authenticate } = require('../utils/authMiddleware');
const aiTools = require('../utils/aiTools');

// Use env var first, fallback to the provisioned key verified to work
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBu9urHeQLzgfWhkgBJkJLu7ZmxrDRl1nY';
const genAI = new GoogleGenerativeAI(API_KEY);

// --- SESSIONS ---
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user.userId })
            .select('title updatedAt')
            .sort({ updatedAt: -1 });
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/sessions/:id', authenticate, async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/sessions/:id', authenticate, async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STANDARD CHAT (No Tools) ---
router.post('/chat', authenticate, async (req, res) => {
    try {
        const { messages, sessionId } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        let history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(messages[messages.length - 1].content);
        const text = result.response.text();

        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId: req.user.userId });
        }
        if (!session) {
            session = new ChatSession({
                userId: req.user.userId,
                title: messages[0].content.substring(0, 40),
                messages: [...messages, { role: 'assistant', content: text }]
            });
        } else {
            session.messages.push(messages[messages.length - 1]);
            session.messages.push({ role: 'assistant', content: text });
        }
        await session.save();

        res.json({ response: text, sessionId: session._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- AGENTIC LOOP (With Workspace Tools) ---
router.post('/agent/run', authenticate, async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        
        // 1. Initialize Gemini with permitted tools
        const toolsDefinition = [{ functionDeclarations: aiTools.getGeminiToolDeclarations() }];
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            tools: toolsDefinition
        });

        // Load History
        let dbHistory = [];
        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId: req.user.userId });
            if (session) {
                dbHistory = session.messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));
            }
        }
        
        // Ensure system prompt rules
        dbHistory.unshift({
            role: 'user',
            parts: [{ text: `You are the Kevryn Autonomous Agent, a professional-grade AI built into a cloud IDE. 
Your goal is to complete projects from start to finish.
You have access to:
1. File System Tools: readFile, writeFile, listFiles (These sync to MongoDB).
2. Terminal Tools: runCommand (This runs on the actual server disk).

When you write code, you should also run 'npm install' or relevant dependency commands if needed.
If a command fails, read the output and fix the code autonomously. 
Always aim for zero-bug delivery.` }]
        });
        dbHistory.push({ role: 'model', parts: [{ text: "Understood. I am now empowered with terminal access. I will build, test, and self-heal projects as the Kevryn Autonomous Agent." }] });

        const chat = model.startChat({ history: dbHistory });

        // Recursive Loop Execution
        let finalResponseText = '';
        let currentPrompt = prompt;

        // Loop safety limit
        for (let loopCount = 0; loopCount < 5; loopCount++) {
            const result = await chat.sendMessage(currentPrompt);
            const response = result.response;
            
            const functionCalls = response.functionCalls();
            
            // If the AI didn't use a tool, it means it's done! Break out of the loop.
            if (!functionCalls || functionCalls.length === 0) {
                finalResponseText = response.text();
                break;
            }

            // Execute Tools
            const toolResponses = [];
            for (const call of functionCalls) {
                console.log(`[AGENT] Executing tool: ${call.name} with args`, call.args);
                const toolResult = await aiTools.executeTool(call.name, call.args, req.user.userId);
                toolResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: toolResult
                    }
                });
            }

            // Loop back to Gemini passing the execution result
            currentPrompt = toolResponses;
        }

        // Save session
        if (!session) {
            session = new ChatSession({
                userId: req.user.userId,
                title: prompt.substring(0, 40),
                messages: [
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: finalResponseText || "Agent finished execution." }
                ]
            });
        } else {
            session.messages.push({ role: 'user', content: prompt });
            session.messages.push({ role: 'assistant', content: finalResponseText || "Agent finished execution." });
        }
        await session.save();

        res.json({ response: finalResponseText || "Agent execution was successfully completed.", sessionId: session._id });
    } catch (error) {
        console.error("Agent Error Engine:", error);
        res.status(500).json({ error: `Agent crashed: ${error.message}` });
    }
});


// --- TERMINAL SELF HEALING ---
// (We ported this from our earlier work, now standardized strictly to Gemini 1.5)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

router.post('/fix-terminal-error', authenticate, async (req, res) => {
    // Exact same secure Gemini 1.5 integration
    try {
        const { code, terminalOutput, language } = req.body;
        if (!code || !terminalOutput) return res.status(400).json({ error: 'Code and terminal output required' });

        const isDocker = fs.existsSync('/.dockerenv');
        let tempFilePath = '';

        if (!isDocker) {
            const ext = language === 'python' ? 'py' : language === 'c' ? 'c' : language === 'cpp' ? 'cpp' : 'js';
            tempFilePath = path.join(os.tmpdir(), `kevryn_fix_${Date.now()}.${ext}`);
            fs.writeFileSync(tempFilePath, code);
        }

        const locationText = isDocker ? "Inside a Docker container." : "Local Path: " + tempFilePath;
        const prompt = `You are a DevOps Agent inside Kevryn IDE.
A user ran an application script here:
${locationText}

Here is the exact crash log from the Web Terminal:
--- CRASH LOG ---
${terminalOutput}
-----------------

And here is their source code:
--- CODE ---
${code}
-----------

Explain exactly what crashed in a short sentence. Then provide the COMPLETELY FIXED ENTIRE SOURCE CODE perfectly wrapped in \`\`\`${language}\n(CODE HERE)\n\`\`\`. Do not omit anything.`;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const explanationPart = text.split('\`\`\`')[0].trim();
        const codeBlockMatch = text.match(/```[a-z]*\n([\s\S]*?)```/i);
        const fixedCode = codeBlockMatch ? codeBlockMatch[1].trim() : code;

        res.json({
            explanation: explanationPart || "Crash resolved by fixing execution errors.",
            fixedCode: fixedCode
        });
    } catch (error) {
        console.error("Self-Healing Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// ── LOCAL AI ROUTES (Ollama — No API Key Required) ──────────────────────────
const ollamaService = require('../services/ollamaService');

/**
 * GET /api/ai/local/status
 * Returns which of the 4 local models are pulled and ready
 */
router.get('/local/status', authenticate, async (req, res) => {
    try {
        const status = await ollamaService.getModelStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/local/chat
 * Chat with any of the 4 local model tiers
 * Body: { messages: [{role, content}], tier: 'fast'|'balanced'|'advanced'|'expert', sessionId? }
 */
router.post('/local/chat', authenticate, async (req, res) => {
    try {
        const { messages, tier = 'balanced', sessionId } = req.body;
        if (!messages || !messages.length) return res.status(400).json({ error: 'Messages are required' });

        const result = await ollamaService.chat(messages, { tier });

        // Persist to chat session
        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId: req.user.userId });
        }
        if (!session) {
            session = new ChatSession({
                userId: req.user.userId,
                title: `[Local AI] ${messages[0].content.substring(0, 40)}`,
                messages: [...messages, { role: 'assistant', content: result.content }]
            });
        } else {
            session.messages.push(messages[messages.length - 1]);
            session.messages.push({ role: 'assistant', content: result.content });
        }
        await session.save();

        res.json({
            response: result.content,
            model: result.model,
            tier,
            sessionId: session._id,
            source: 'local'
        });
    } catch (error) {
        console.error('[Local AI Chat]', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/local/agent/run
 * Full agentic loop — model can read/write files and run terminal commands
 * Body: { prompt, tier?: 'expert', sessionId? }
 */
router.post('/local/agent/run', authenticate, async (req, res) => {
    try {
        const { prompt, tier, sessionId } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        console.log(`[Kevryn Local Agent] Running for user ${req.user.userId}, tier: ${tier || 'expert'}`);

        const result = await ollamaService.runAgentLoop(prompt, aiTools, req.user.userId, { tier });

        // Persist to chat session
        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId: req.user.userId });
        }
        if (!session) {
            session = new ChatSession({
                userId: req.user.userId,
                title: `[Local Agent] ${prompt.substring(0, 40)}`,
                messages: [
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: result.response || 'Agent execution completed.' }
                ]
            });
        } else {
            session.messages.push({ role: 'user', content: prompt });
            session.messages.push({ role: 'assistant', content: result.response || 'Agent execution completed.' });
        }
        await session.save();

        res.json({
            response: result.response,
            model: result.model,
            loops: result.loops,
            sessionId: session._id,
            source: 'local'
        });
    } catch (error) {
        console.error('[Local Agent Error]', error);
        res.status(500).json({ error: `Local Agent crashed: ${error.message}` });
    }
});

/**
 * POST /api/ai/local/fix
 * Terminal error self-healing via local model (no internet needed)
 * Body: { code, terminalOutput, language, tier? }
 */
router.post('/local/fix', authenticate, async (req, res) => {
    try {
        const { code, terminalOutput, language, tier = 'advanced' } = req.body;
        if (!code || !terminalOutput) return res.status(400).json({ error: 'Code and terminal output required' });

        const fixResponse = await ollamaService.analyzeError(code, language, terminalOutput, tier);

        const explanationPart = fixResponse.split('```')[0].trim();
        const codeBlockMatch = fixResponse.match(/```[a-z]*\n([\s\S]*?)```/i);
        const fixedCode = codeBlockMatch ? codeBlockMatch[1].trim() : code;

        res.json({
            explanation: explanationPart || 'Error analyzed and fixed by local AI.',
            fixedCode,
            source: 'local'
        });
    } catch (error) {
        console.error('[Local Fix Error]', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/local/generate
 * Generate code from a description using local model
 * Body: { description, language, tier? }
 */
router.post('/local/generate', authenticate, async (req, res) => {
    try {
        const { description, language = 'javascript', tier = 'balanced' } = req.body;
        if (!description) return res.status(400).json({ error: 'Description is required' });

        const result = await ollamaService.generateCode(description, language, tier);
        res.json({ code: result, source: 'local' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

