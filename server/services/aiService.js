/**
 * Kevryn AI Service — YOUR Custom Model Only
 * Uses: ravirajjavvadi0512/kevryn-neural-core (HF Inference API)
 * No Gemini. No Ollama. No Mirrors. No Fallbacks.
 */
const axios = require('axios');

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = 'ravirajjavvadi0512/kevryn-neural-core';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// ── KEEP-ALIVE PING ─────────────────────────────────────────────
// Pings HF every 5 minutes to keep the model warm (prevents cold starts)
const startKeepAlive = () => {
    const ping = () => {
        if (!HF_TOKEN) return;
        axios.post(HF_API_URL, { inputs: 'ping' }, {
            headers: { Authorization: `Bearer ${HF_TOKEN}` },
            timeout: 10000
        }).then(() => {
            console.log('[KeepAlive] Model is warm ✓');
        }).catch(() => {
            console.log('[KeepAlive] Model is loading...');
        });
    };

    // Initial ping on server boot
    setTimeout(ping, 5000);
    // Then every 5 minutes
    setInterval(ping, 5 * 60 * 1000);
    console.log('[KeepAlive] Neural Core keep-alive started (every 5 min)');
};

// ── CHAT ─────────────────────────────────────────────────────────
const chat = async (messages) => {
    if (!HF_TOKEN) {
        throw new Error('HF_TOKEN is not set. Please add it to your environment variables.');
    }

    // Format messages for Llama 3.1 Instruct
    const prompt = messages.map(m => {
        if (m.role === 'system') return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${m.content}<|eot_id|>`;
        if (m.role === 'user') return `<|start_header_id|>user<|end_header_id|>\n${m.content}<|eot_id|>`;
        return `<|start_header_id|>assistant<|end_header_id|>\n${m.content}<|eot_id|>`;
    }).join('\n') + '\n<|start_header_id|>assistant<|end_header_id|>\n';

    try {
        console.log(`[NeuralCore] Calling your custom model...`);

        const response = await axios.post(HF_API_URL, {
            inputs: prompt,
            parameters: {
                max_new_tokens: 1024,
                temperature: 0.7,
                top_p: 0.9,
                return_full_text: false,
                stop: ['<|eot_id|>', '<|end_of_text|>']
            }
        }, {
            headers: { Authorization: `Bearer ${HF_TOKEN}` },
            timeout: 60000 // 60s timeout (generous for first load)
        });

        // Parse response
        let content = '';
        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            content = response.data[0].generated_text;
        } else if (typeof response.data === 'string') {
            content = response.data;
        } else if (response.data?.generated_text) {
            content = response.data.generated_text;
        } else {
            content = JSON.stringify(response.data);
        }

        // Clean up any leftover tokens
        content = content.replace(/<\|eot_id\|>/g, '').replace(/<\|end_of_text\|>/g, '').trim();

        if (!content || content.length === 0) {
            throw new Error('Model returned empty response');
        }

        return { content, model: 'Kevryn Neural Core' };
    } catch (e) {
        // Handle HF-specific errors clearly
        const hfError = e.response?.data?.error;
        if (hfError) {
            if (typeof hfError === 'string' && hfError.includes('loading')) {
                const time = e.response.data.estimated_time || 30;
                throw new Error(`Model is loading (~${Math.round(time)}s). The keep-alive ping will prevent this in the future. Please try again shortly.`);
            }
            throw new Error(`HF API Error: ${hfError}`);
        }
        if (e.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Your model may be loading. Please try again in a moment.');
        }
        throw new Error(`AI Service Error: ${e.message}`);
    }
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

module.exports = {
    chat,
    analyzeError,
    generateCode,
    startKeepAlive
};
