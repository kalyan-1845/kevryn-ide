/**
 * Kevryn AI Service — Your Neural Core
 * Primary: Groq (Llama 3.1 8B — same base model your adapter was trained on)
 * Groq is always-on, zero cold starts, free, and ultra-fast.
 */
const axios = require('axios');

const GROQ_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY // Fallback
].filter(Boolean);

const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── CHAT ─────────────────────────────────────────────────────────
const chat = async (messages) => {
    if (GROQ_KEYS.length === 0) {
        throw new Error('No Groq API keys found. Please check your environment variables.');
    }

    let lastError = null;
    for (let i = 0; i < GROQ_KEYS.length; i++) {
        const key = GROQ_KEYS[i];
        try {
            console.log(`[NeuralCore] Attempting Kevryn Neural Core with Key ${i+1}...`);

            const response = await axios.post(GROQ_URL, {
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.9,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const content = response.data?.choices?.[0]?.message?.content;
            if (!content) throw new Error('Model returned empty response');

            return { content, model: 'Kevryn Neural Core' };
        } catch (e) {
            console.error(`[NeuralCore] Key ${i+1} failed: ${e.message}`);
            lastError = e;
            // Continue to next key
        }
    }

    // If all keys fail
    if (lastError?.response?.data?.error) {
        throw new Error(`AI Error: ${lastError.response.data.error.message || JSON.stringify(lastError.response.data.error)}`);
    }
    throw new Error(`AI Service Error (All keys failed): ${lastError?.message || 'Unknown error'}`);
};

// ── ANALYZE ERROR (for terminal self-healing) ────────────────────
const analyzeError = async (code, language, terminalOutput) => {
    const messages = [{
        role: 'user',
        content: `You are a senior developer. A user has this code:\n\n\`\`\`${language || 'code'}\n${code}\n\`\`\`\n\nIt produced this error:\n\`\`\`\n${terminalOutput}\n\`\`\`\n\nExplain the bug in one sentence. Then provide the COMPLETE fixed code wrapped in a code block.`
    }];
    const result = await chat(messages);
    return result.content;
};

// ── GENERATE CODE ────────────────────────────────────────────────
const generateCode = async (description, language) => {
    const messages = [{
        role: 'user',
        content: `Write ${language || 'code'} for: ${description}. Provide only the code in a code block.`
    }];
    const result = await chat(messages);
    return result.content;
};

// Keep-alive not needed — Groq is always on
const startKeepAlive = () => {
    console.log('[NeuralCore] Groq is always-on — no keep-alive needed ✓');
};

module.exports = {
    chat,
    analyzeError,
    generateCode,
    startKeepAlive
};
