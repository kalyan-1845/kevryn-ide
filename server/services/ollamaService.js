const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBu9urHeQLzgfWhkgBJkJLu7ZmxrDRl1nY';
const genAI = new GoogleGenerativeAI(API_KEY);

const LOCAL_OLLAMA_URL = 'http://localhost:11434/api/chat';
const NEURAL_MODEL = 'kevryn-neural';

const mirrors = [
    'https://api.airforce/v1/chat/completions', 
    'https://text.pollinations.ai/',
    'https://open-ai-mirror.vercel.app/api/chat'
];

const tiers = {
    fast: { mirror: 'qwen-2.5-7b-instruct', fallback: 'gemini-2.0-flash' },
    balanced: { mirror: 'llama-3.1-8b-instruct', fallback: 'gemini-2.0-flash' },
    expert: { mirror: NEURAL_MODEL, fallback: 'gemini-2.0-flash' } // Neural Core is now the Expert
};

/**
 * Checks if a specific model exists in local Ollama
 */
const checkLocalModel = async (modelName) => {
    try {
        const response = await axios.get('http://localhost:11434/api/tags');
        return response.data.models.some(m => m.name.includes(modelName));
    } catch (e) {
        return false;
    }
};

const chatWithGemini = async (messages, modelName = "gemini-2.0-flash") => {
    try {
        console.log(`[NeuralCore] Falling back to Master Gemini 2.0...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(messages[messages.length - 1].content);
        return { content: result.response.text(), model: `Master ${modelName}` };
    } catch (e) {
        console.error("[NeuralCore] Gemini failure:", e.message);
        throw e;
    }
};

/**
 * HYBRID NEURAL BRIDGE 🧠⚡
 * 1. Checks Local Ollama (Your custom brain)
 * 2. Falls back to Cloud Mirrors (Pollinations/Groq)
 * 3. Final fallback to Gemini 2.0
 */
const chat = async (messages, options = {}) => {
    const tierKey = options.tier || 'balanced';
    const tier = tiers[tierKey] || tiers.balanced;

    // A. TRY LOCAL NEURAL CORE (If Expert tier requested)
    if (tierKey === 'expert' || tier.mirror === NEURAL_MODEL) {
        const isReady = await checkLocalModel(NEURAL_MODEL);
        if (isReady) {
            try {
                console.log(`[NeuralCore] Activating Local Expert Brain (${NEURAL_MODEL})...`);
                const response = await axios.post(LOCAL_OLLAMA_URL, {
                    model: NEURAL_MODEL,
                    messages,
                    stream: false
                }, { timeout: 30000 });
                
                return { 
                    content: response.data.message.content, 
                    model: `Local Neural Core (${NEURAL_MODEL})` 
                };
            } catch (e) {
                console.warn(`[NeuralCore] Local engine offline, switching to cloud failover...`);
            }
        }
    }

    // B. TRY CLOUD MIRRORS
    for (const mirror of mirrors) {
        try {
            console.log(`[Mirror] Attempting ${mirror} for ${tier.mirror}...`);
            const payload = { 
                messages, 
                model: tier.mirror === NEURAL_MODEL ? 'llama-3.1-8b-instruct' : tier.mirror, 
                stream: false 
            };
            const response = await axios.post(mirror, payload, { timeout: 15000 });
            
            let content = response.data.choices?.[0]?.message?.content || response.data.content || response.data;
            if (content && content.length > 5) {
                return { content, model: `Cloud ${tier.mirror}` };
            }
        } catch (error) {
            console.warn(`[Mirror] ${mirror} failed:`, error.message);
        }
    }

    // C. MASTER FALLBACK
    return await chatWithGemini(messages, tier.fallback);
};

module.exports = {
    chat,
    getModelStatus: async () => ({ tiers }),
    runAgentLoop: async (prompt, tools, userId, options) => {
        const res = await chat([{ role: 'user', content: prompt }], options);
        return { response: res.content, model: res.model, loops: 1 };
    },
    analyzeError: async (c, l, t) => (await chat([{ role: 'user', content: `Fix: ${t}\nCode: ${c}` }], { tier: 'expert' })).content,
    generateCode: async (d, l) => (await chat([{ role: 'user', content: `Write ${l} for: ${d}` }])).content
};
