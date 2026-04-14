const axios = require('axios');

/**
 * HighAvailabilityOpenAIService (Functional Version)
 * Ensures 24/7 AI availability by rotating through multiple mirrors.
 */

const mirrors = [
    'https://text.pollinations.ai/',
    'https://api.airforce/v1/chat/completions',
    'https://open-ai-mirror.vercel.app/api/chat'
];

const tiers = {
    fast: 'qwen-2.5-7b-instruct',
    balanced: 'llama-3.1-8b-instruct',
    advanced: 'gpt-4o',
    expert: 'qwen'
};

const getModelStatus = async () => {
    return {
        tiers: {
            fast: { ready: true, model: 'Qwen-2.5 7B' },
            balanced: { ready: true, model: 'Llama 3.1' },
            advanced: { ready: true, model: 'Universal Expert' },
            expert: { ready: true, model: 'Qwen-Coder' }
        }
    };
};

const chat = async (messages, options = {}) => {
    const tier = options.tier || 'balanced';
    const model = tiers[tier] || tiers.balanced;
    let lastError = null;

    for (const mirror of mirrors) {
        try {
            console.log(`[CloudAI] Mirror: ${mirror} | Tier: ${tier}`);
            
            let payload;
            if (mirror.includes('pollinations')) {
                payload = { messages, model, stream: false, seed: Date.now() };
            } else if (mirror.includes('chat/completions') || mirror.includes('v1')) {
                payload = { messages, model, stream: false };
            } else {
                payload = { messages, model };
            }

            const response = await axios.post(mirror, payload, { timeout: 15000 });

            let content = '';
            const data = response.data;
            if (data.choices && data.choices[0].message) {
                content = data.choices[0].message.content;
            } else if (data.content) {
                content = data.content;
            } else if (typeof data === 'string') {
                content = data;
            }

            if (content && content.length > 0) {
                return { content, model };
            }
        } catch (error) {
            lastError = error;
            console.warn(`[CloudAI] Fallback on ${mirror} error:`, error.message);
        }
    }

    throw new Error(`AI Mirror System is busy. (${lastError?.message || 'Try again in 30s'})`);
};

const runAgentLoop = async (prompt, tools, userId, options = {}) => {
    const tier = options.tier || 'expert';
    const model = tiers[tier] || tiers.expert;

    const messages = [
        { role: 'system', content: 'You are the Kevryn Expert AI Agent. Assist the user with their workspace.' },
        { role: 'user', content: prompt }
    ];

    const chatResult = await chat(messages, { tier });
    
    return {
        response: chatResult.content,
        model: model,
        loops: 1
    };
};

const analyzeError = async (code, language, terminalOutput, tier = 'advanced') => {
    const prompt = `Fix crash in ${language}:\nCrash: ${terminalOutput}\nCode: ${code}\nReturn ONLY fixed code.`;
    const result = await chat([{ role: 'user', content: prompt }], { tier });
    return result.content;
};

const generateCode = async (description, language, tier = 'balanced') => {
    const prompt = `Write ${language} code for: ${description}. Code only.`;
    const result = await chat([{ role: 'user', content: prompt }], { tier });
    return result.content;
};

module.exports = {
    getModelStatus,
    chat,
    runAgentLoop,
    analyzeError,
    generateCode
};
