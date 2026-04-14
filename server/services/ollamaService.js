const axios = require('axios');

/**
 * HighAvailabilityOpenAIService
 * Ensures 24/7 AI availability by rotating through multiple 
 * free open-source mirrors (Pollinations, Chimera, and Mirror Proxies).
 */
class HighAvailabilityOpenAIService {
    constructor() {
        // High-availability mirrors
        this.mirrors = [
            'https://text.pollinations.ai/',
            'https://api.airforce/v1/chat/completions', // Stable High-speed Mirrror
            'https://open-ai-mirror.vercel.app/api/chat' // Backup Proxy
        ];
        
        this.tiers = {
            fast: 'qwen-2.5-7b-instruct',
            balanced: 'llama-3.1-8b-instruct',
            advanced: 'gpt-4o', // Some mirrors allow high-tier aliases
            expert: 'qwen'
        };
    }

    async getModelStatus() {
        return {
            tiers: {
                fast: { ready: true, model: 'Qwen-2.5 7B' },
                balanced: { ready: true, model: 'Llama 3.1' },
                advanced: { ready: true, model: 'Universal Expert' },
                expert: { ready: true, model: 'Qwen-Coder' }
            }
        };
    }

    /**
     * Smart Chat with Auto-Mirror Fallback
     */
    async chat(messages, options = {}) {
        const tier = options.tier || 'balanced';
        const model = this.tiers[tier] || this.tiers.balanced;
        let lastError = null;

        // Try rotating through mirrors until one works
        for (const mirror of this.mirrors) {
            try {
                console.log(`[HighAvailability] Trying mirror: ${mirror} for tier ${tier}`);
                
                // Determine format based on mirror type
                let payload;
                if (mirror.includes('pollinations')) {
                    payload = { messages, model, stream: false, seed: Date.now() };
                } else if (mirror.includes('chat/completions') || mirror.includes('v1')) {
                    payload = { messages, model, stream: false };
                } else {
                    payload = { messages, model };
                }

                const response = await axios.post(mirror, payload, { timeout: 15000 });

                // Handle different response formats from different mirrors
                let content = '';
                if (response.data.choices && response.data.choices[0].message) {
                    content = response.data.choices[0].message.content;
                } else if (response.data.content) {
                    content = response.data.content;
                } else if (typeof response.data === 'string') {
                    content = response.data;
                }

                if (content && content.length > 0) {
                    return { content, model };
                }
            } catch (error) {
                lastError = error;
                console.warn(`[HighAvailability] Mirror ${mirror} failed:`, error.message);
                // Continue to next mirror
            }
        }

        throw new Error(`Kevryn AI is under extreme load. Error: ${lastError.message}. Please try again in 30 seconds.`);
    }

    /**
     * Agentic Loop Logic
     */
    async runAgentLoop(prompt, tools, userId, options = {}) {
        const tier = options.tier || 'expert';
        const model = this.tiers[tier] || this.tiers.expert;

        const systemPrompt = `You are the Kevryn Expert AI Agent. Solve the task professionally.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        const chatResult = await this.chat(messages, { tier });
        
        return {
            response: chatResult.content,
            model: model,
            loops: 1
        };
    }

    async analyzeError(code, language, terminalOutput, tier = 'advanced') {
        const prompt = `Fix this ${language} crash:\nLog: ${terminalOutput}\nCode: ${code}\nReturn ONLY fixed code.`;
        const result = await this.chat([{ role: 'user', content: prompt }], { tier });
        return result.content;
    }

    async generateCode(description, language, tier = 'balanced') {
        const prompt = `Write ${language} code for: ${description}. Code only.`;
        const result = await this.chat([{ role: 'user', content: prompt }], { tier });
        return result.content;
    }
}

module.exports = new HighAvailabilityOpenAIService();
