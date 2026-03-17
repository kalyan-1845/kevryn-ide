const axios = require('axios');

/**
 * AiProviderService - Accesses powerful free AI models via Pollinations.ai 
 * (Supports models mentioned by user: GPT-4o mini, Claude, Llama, Mixtral)
 */
class AiProviderService {
    constructor() {
        this.baseURL = 'https://text.pollinations.ai/';
        this.models = {
            'gpt-4o-mini': 'openai',
            'claude-3-haiku': 'claude', // Pollinations' internal mapping
            'llama-3': 'llama',
            'mixtral-8x7b': 'mistral'
        };
    }

    /**
     * Send chat message to Pollinations
     */
    async chat(messages, options = {}) {
        try {
            const model = options.model || 'gpt-4o-mini'; 
            
            // Pollinations text API uses a simple POST to / with messages
            const pollinationsModel = this.models[model] || model;

            // Sanitize messages to only include role and content (prevents Mongoose object bleed-in)
            const sanitizedMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await axios.post(this.baseURL, {
                messages: sanitizedMessages,
                model: pollinationsModel,
                seed: Math.floor(Math.random() * 100000),
                jsonMode: options.jsonMode || false
            }, {
                timeout: 30000 // 30s timeout
            });

            if (!response.data) throw new Error('Empty response from AI Provider');
            
            // Pollinations sometimes returns raw text even on POST, or a JSON object depending on path
            return typeof response.data === 'string' ? response.data : (response.data.content || response.data.choices?.[0]?.message?.content || JSON.stringify(response.data));

        } catch (error) {
            console.error('[AiProviderService] Error:', error.message);
            const detail = error.response?.data || error.message;
            throw new Error(`Kevryn AI Engine Error: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
        }
    }

    // Helper methods mirroring GroqService for easy integration
    async explainCode(code, language, model) {
        return await this.chat([
            { role: 'system', content: 'You are a helpful code assistant.' },
            { role: 'user', content: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
        ], { model });
    }

    async fixCode(code, language, error, projectContext, model) {
        const contextMsg = projectContext ? `\n\nProject Structure:\n${projectContext}` : "";
        return await this.chat([
            { role: 'system', content: `You are an expert debugger. Access to context: ${contextMsg}` },
            { role: 'user', content: `Fix this ${language} code${error ? `: ${error}` : ''}:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
        ], { model });
    }

    async generateImplementationPlan(prompt, projectContext, model) {
        const messages = [
            {
                role: 'system',
                content: `You are a senior full-stack developer. 
                Return a STRICT JSON object:
                {
                    "explanation": "...",
                    "files": [{ "path": "...", "action": "create|update|delete", "content": "..." }],
                    "commands": ["..."]
                }
                Current Context: ${projectContext}`
            },
            { role: 'user', content: prompt }
        ];
        
        const response = await this.chat(messages, { model, jsonMode: true });
        
        // Extract JSON from response
        try {
            let jsonStr = response.trim();
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse AI plan:", response);
            throw new Error("AI failed to generate a valid project plan. Try again.");
        }
    }
}

module.exports = new AiProviderService();
