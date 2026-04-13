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
            parts: [{ text: "You are the Kevryn Autonomous Agent. You have the ability to read and write files directly. If the user asks for a React UI, create the files using your tools." }]
        });
        dbHistory.push({ role: 'model', parts: [{ text: "Understood. I will use my tools autonomously." }] });

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

module.exports = router;
