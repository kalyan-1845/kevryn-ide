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
            const model = options.model || 'openai'; // default to GPT-4o mini style
            
            // Pollinations text API uses a simple POST to / with messages
            // Mapping common model names to Pollinations specific identifiers
            const pollinationsModel = this.models[model] || model;

            const response = await axios.post(this.baseURL, {
                messages: messages,
                model: pollinationsModel,
                seed: Math.floor(Math.random() * 100000)
            });

            return response.data || 'No response from AI';
        } catch (error) {
            console.error('[AiProviderService] Error:', error.message);
            throw new Error(`AI Agent Error: ${error.response?.data || error.message}`);
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
        
        const response = await this.chat(messages, { model });
        
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
