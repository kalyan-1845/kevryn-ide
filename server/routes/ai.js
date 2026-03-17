const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const aiProviderService = require('../services/aiProviderService');
const ollamaService = require('../services/ollamaService');
const jwt = require('jsonwebtoken');
const File = require('../File');
const ChatSession = require('../models/ChatSession');
const { authenticate } = require('../utils/authMiddleware'); // Use global middleware

/**
 * Helper: Choose AI service based on model
 */
function getAiService(model) {
    if (!model || model === 'groq' || model.startsWith('llama-3.3')) return groqService;
    if (model.includes('ollama')) return ollamaService;
    return aiProviderService;
}

// Helper: Get project file tree
async function getProjectFileTree(userId) {
    try {
        const files = await File.find({ owner: userId }).select('name type parentId');
        const childrenMap = {};
        files.forEach(f => {
            const pid = f.parentId || 'root';
            if (!childrenMap[pid]) childrenMap[pid] = [];
            childrenMap[pid].push(f);
        });

        let output = "";
        const traverse = (parentId, depth = 0) => {
            const children = childrenMap[parentId] || [];
            children.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });

            for (const child of children) {
                const prefix = "  ".repeat(depth);
                const indicator = child.type === 'folder' ? '/' : '';
                output += `${prefix}${child.name}${indicator}\n`;
                if (child.type === 'folder') {
                    traverse(child._id.toString(), depth + 1);
                }
            }
        };
        traverse('root');
        return output;
    } catch (e) {
        console.error("Context Error:", e);
        return "";
    }
}

// Auth middleware removed - now using central authenticate from utils/authMiddleware

// Check if Groq is available
router.get('/status', (req, res) => {
    try {
        const available = groqService.isAvailable();
        res.json({
            available,
            provider: 'groq',
            model: groqService.model,
            message: available ? 'Kevryn AI is ready' : 'AI Core is active. Free models available.'
        });
    } catch (error) {
        res.json({ available: false, provider: 'groq', message: error.message });
    }
});

// Set API key at runtime
router.post('/api-key', (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey || !apiKey.trim()) {
            return res.status(400).json({ error: 'API key is required' });
        }
        groqService.setApiKey(apiKey.trim());
        res.json({ success: true, message: 'AI Core linked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat with AI
router.post('/chat', authenticate, async (req, res) => {
    try {
        const { messages, model, sessionId } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required' });
        }

        const projectContext = await getProjectFileTree(req.user.userId);
        const service = getAiService(model);

        // Inject context into system message
        const contextMsg = projectContext ? `\n\nProject Structure:\n${projectContext}` : '';
        const systemPrompt = `You are a helpful AI assistant integrated into Kevryn Studio. You have access to the project structure:${contextMsg}`;
        
        let aiMessages = [...messages];
        let systemFound = false;
        for (let m of aiMessages) {
            if (m.role === 'system') {
                m.content += contextMsg;
                systemFound = true;
                break;
            }
        }
        if (!systemFound) {
            aiMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await service.chat(aiMessages, { model });

        // Save to history if sessionId or new session needed
        if (req.user && req.user.userId) {
            let session;
            if (sessionId) {
                session = await ChatSession.findById(sessionId);
            }

            if (!session) {
                // Create new session if none provided or not found
                const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
                const title = firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? '...' : '');
                session = new ChatSession({
                    userId: req.user.userId,
                    title,
                    messages: messages // Use primitive messages without injected system context
                });
            } else {
                // Update existing session
                // We only add the last two messages (user prompt and AI response)
                const lastUserMsg = messages[messages.length - 1];
                session.messages.push(lastUserMsg);
            }
            
            session.messages.push({ role: 'assistant', content: response });
            await session.save();
            
            return res.json({ response, sessionId: session._id });
        }

        res.json({ response });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- HISTORY ROUTES ---

// List sessions
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user.userId })
            .sort({ updatedAt: -1 })
            .select('title updatedAt');
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific session
router.get('/sessions/:id', authenticate, async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete session
router.delete('/sessions/:id', authenticate, async (req, res) => {
    try {
        await ChatSession.deleteOne({ _id: req.params.id, userId: req.user.userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Explain code
router.post('/explain', authenticate, async (req, res) => {
    try {
        const { code, language, model } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const service = getAiService(model);
        const explanation = await service.explainCode(code, language || 'code', model);
        res.json({ explanation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fix code
router.post('/fix', authenticate, async (req, res) => {
    try {
        const { code, language, error, model } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const projectContext = await getProjectFileTree(req.user.userId);
        const service = getAiService(model);
        const fixed = await service.fixCode(code, language || 'code', error, projectContext, model);
        res.json({ fixed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Optimize code
router.post('/optimize', authenticate, async (req, res) => {
    try {
        const { code, language, model } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const service = getAiService(model);
        const optimized = await service.optimizeCode(code, language || 'code', model);
        res.json({ optimized });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate code
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { description, language, model } = req.body;
        if (!description) return res.status(400).json({ error: 'Description is required' });

        const service = getAiService(model);
        const generated = await service.generateCode(description, language || 'javascript', model);
        res.json({ generated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze error
router.post('/analyze-error', authenticate, async (req, res) => {
    try {
        const { code, language, errorOutput, model } = req.body;
        if (!code || !errorOutput) return res.status(400).json({ error: 'Code and error output are required' });

        const projectContext = await getProjectFileTree(req.user.userId);
        const service = getAiService(model);
        const analysis = await service.analyzeError(code, language || 'code', errorOutput, projectContext, model);
        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add comments
router.post('/comment', authenticate, async (req, res) => {
    try {
        const { code, language, model } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const service = getAiService(model);
        const commented = await service.addComments(code, language || 'code', model);
        res.json({ commented });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Auto-Dev Plan Generation (THE KEVRYN AI ENGINE)
router.post('/auto/plan', authenticate, async (req, res) => {
    try {
        const { prompt, model } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        // Fetch project context
        const files = await File.find({ owner: req.user.userId });
        const fileTree = await getProjectFileTree(req.user.userId);

        // Contextualize: Send file tree AND full content of most recent files
        // (Sorted by updatedAt to give AI the most relevant code)
        const projectContext = files
            .sort((a,b) => b.updatedAt - a.updatedAt)
            .slice(0, 50) // Send a good chunk of files
            .map(f => ({
                name: f.name,
                content: f.content || ""
            })).filter(f => !f.name.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4)$/i));

        const fullContext = `Project Directory Structure:\n${fileTree}\n\nFile Contents:\n${JSON.stringify(projectContext)}`;

        const service = getAiService(model);
        const plan = await service.generateImplementationPlan(prompt, fullContext, model);
        res.json({ plan });
    } catch (error) {
        console.error("Auto Plan Error:", error);
        res.status(500).json({ error: "Failed to generate plan: " + error.message });
    }
});

module.exports = router;
