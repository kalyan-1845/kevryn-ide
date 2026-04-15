const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const HF_TOKEN = process.env.HF_TOKEN; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const HF_REPO_ID = 'ravirajjavvadi0512/kevryn-neural-core';
const HF_BASE_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

const mirrors = [
    'https://api.airforce/v1/chat/completions', 
    'https://text.pollinations.ai/',
    'https://open-ai-mirror.vercel.app/api/chat'
];

const tiers = {
    fast: { name: 'Kevryn AI (Fast)', mirror: 'qwen-2.5-7b-instruct', fallback: 'gemini-2.0-flash' },
    balanced: { name: 'Kevryn AI (Balanced)', mirror: 'llama-3.1-8b-instruct', fallback: 'gemini-2.0-flash' },
    advanced: { name: 'Kevryn AI (Advanced)', mirror: 'gpt-4o', fallback: 'gemini-2.0-flash' },
    expert: { name: 'Kevryn AI (Expert)', hf: true, fallback: 'gemini-2.0-flash' }
};

/**
 * Chat with Hugging Face Inference API (Neural Core) 🧠🛰️
 */
const chatWithHF = async (messages) => {
    try {
        console.log(`[NeuralCore] Calling Global Neural Brain (HF)...`);
        
        // Format for Llama 3.1
        const prompt = messages.map(m => `${m.role === 'user' ? '<|user|>' : '<|assistant|>'}\n${m.content}<|end|>`).join('\n') + '\n<|assistant|>\n';

        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${HF_REPO_ID}`,
            {
                inputs: prompt,
                parameters: { 
                    max_new_tokens: 1024, 
                    temperature: 0.7, 
                    top_p: 0.9,
                    return_full_text: false
                }
            },
            {
                headers: { Authorization: `Bearer ${HF_TOKEN}` },
                timeout: 30000
            }
        );

        let content = response.data[0]?.generated_text || response.data;
        // Strip the prompt from the response if HF returns it
        if (content.includes('<|assistant|>')) {
            content = content.split('<|assistant|>').pop().trim();
        }

        return { content, model: 'Kevryn Neural Core (Cloud)' };
    } catch (e) {
        console.error("[NeuralCore] HF Cloud failure:", e.response?.data || e.message);
        throw e;
    }
};

const chatWithGemini = async (messages, modelName = "gemini-2.0-flash") => {
    try {
        console.log(`[NeuralCore] Falling back to Kevryn Cloud...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(messages[messages.length - 1].content);
        return { content: result.response.text(), model: `Kevryn Cloud` };
    } catch (e) {
        console.error("[NeuralCore] Cloud failure:", e.message);
        throw e;
    }
};

/**
 * HYBRID NEURAL BRIDGE 🧠⚡
 * 1. Primary: Hugging Face Neural Vault (Your Private Brain)
 * 2. Failover: Cloud Open Inference (Mirrors)
 * 3. Final: Gemini 2.0 (The Master Key)
 */
const chat = async (messages, options = {}) => {
    const tierKey = options.tier || 'balanced';
    const tier = tiers[tierKey] || tiers.balanced;

    // A. TRY NEURAL EXPERT (HF CLOUD)
    if (tierKey === 'expert' || tier.hf) {
        try {
            return await chatWithHF(messages);
        } catch (e) {
            console.warn(`[NeuralCore] HF Vault offline, switching to open mirrors...`);
        }
    }

    // B. TRY CLOUD MIRRORS
    for (const mirror of mirrors) {
        try {
            console.log(`[Mirror] Attempting Kevryn Cloud Failover...`);
            const payload = { 
                messages, 
                model: tierKey === 'expert' ? 'llama-3.1-8b-instruct' : (tier.mirror || 'llama-3.1-8b-instruct'), 
                stream: false 
            };
            const response = await axios.post(mirror, payload, { timeout: 15000 });
            
            let content = response.data.choices?.[0]?.message?.content || response.data.content || response.data;
            if (content && content.length > 5) {
                return { content, model: tier.name };
            }
        } catch (error) {
            console.warn(`[Mirror] failover failed:`, error.message);
        }
    }

    // C. MASTER FALLBACK
    return await chatWithGemini(messages, tier.fallback);
};

module.exports = {
    chat,
    getModelStatus: async () => ({ tiers, provider: 'Hugging Face Cloud' }),
    runAgentLoop: async (prompt, tools, userId, options) => {
        const res = await chat([{ role: 'user', content: prompt }], options);
        return { response: res.content, model: res.model, loops: 1 };
    },
    analyzeError: async (c, l, t) => (await chat([{ role: 'user', content: `Fix: ${t}\nCode: ${c}` }], { tier: 'expert' })).content,
    generateCode: async (d, l) => (await chat([{ role: 'user', content: `Write ${l} for: ${d}` }])).content
};
