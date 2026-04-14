const axios = require('axios');

/**
 * Kevryn Local AI Engine — Powered by Ollama
 * 
 * 3-Tier Model System (No API Keys — 100% Local):
 *   - Model A (Fast)     : qwen2.5:0.5b   ~450MB  → Quick queries, summaries
 *   - Model B (Balanced) : qwen2.5:1.5b   ~1.1GB  → Everyday coding assistant
 *   - Model C (Advanced) : gemma2:2b      ~1.8GB  → Deep reasoning, code audits
 */
class OllamaService {
    constructor() {
        this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';

        // 4-Tier Model Registry
        this.models = {
            fast: {
                name: process.env.OLLAMA_MODEL_FAST || 'qwen2.5:0.5b',
                label: '⚡ Fast (Qwen2.5 0.5B)',
                description: 'Quick queries, summaries, basic help',
                ramMB: 450
            },
            balanced: {
                name: process.env.OLLAMA_MODEL_BALANCED || 'qwen2.5:1.5b',
                label: '⚖️ Balanced (Qwen2.5 1.5B)',
                description: 'Everyday coding, conversations, explanations',
                ramMB: 1100
            },
            advanced: {
                name: process.env.OLLAMA_MODEL_ADVANCED || 'gemma2:2b',
                label: '🧠 Advanced (Gemma-2 2B)',
                description: 'Deep reasoning, code audits, cybersecurity analysis',
                ramMB: 1800
            },
            expert: {
                name: process.env.OLLAMA_MODEL_EXPERT || 'qwen2.5-coder:7b',
                label: '🚀 Expert (Qwen2.5-Coder 7B)',
                description: 'Full agentic coding — GPT-3.5 level, code generation, autonomous builds',
                ramMB: 4700
            }
        };

        // Default tier (use 'expert' for agent tasks, 'balanced' for chat)
        this.defaultTier = process.env.OLLAMA_DEFAULT_TIER || 'balanced';
        this.defaultAgentTier = process.env.OLLAMA_AGENT_TIER || 'expert';
    }

    // ─── Status & Discovery ────────────────────────────────────────────────────

    async isAvailable() {
        try {
            await axios.get(`${this.baseURL}/api/tags`, { timeout: 3000 });
            return true;
        } catch {
            return false;
        }
    }

    async listPulledModels() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
            return response.data.models || [];
        } catch {
            return [];
        }
    }

    /**
     * Get status of all 3 tiers — which are pulled and ready
     */
    async getModelStatus() {
        const ollamaRunning = await this.isAvailable();
        if (!ollamaRunning) {
            return {
                ollamaRunning: false,
                message: 'Ollama is not running. Start it with: ollama serve',
                tiers: {}
            };
        }

        const pulledModels = await this.listPulledModels();
        const pulledNames = pulledModels.map(m => m.name);

        const tiers = {};
        for (const [tier, info] of Object.entries(this.models)) {
            const isReady = pulledNames.some(n => n.startsWith(info.name.split(':')[0]));
            tiers[tier] = {
                ...info,
                ready: isReady,
                status: isReady ? '🟢 Ready' : '🔴 Not Pulled',
                pullCommand: isReady ? null : `ollama pull ${info.name}`
            };
        }

        return { ollamaRunning: true, tiers };
    }

    // ─── Core Chat ─────────────────────────────────────────────────────────────

    /**
     * Resolve tier name → actual model string
     */
    resolveModel(tierOrModelName) {
        if (this.models[tierOrModelName]) {
            return this.models[tierOrModelName].name;
        }
        // Allow passing raw model name (e.g., 'qwen2.5:0.5b') directly
        return tierOrModelName || this.models[this.defaultTier].name;
    }

    /**
     * Core chat — sends messages to a local model
     * @param {Array} messages - [{role, content}, ...]
     * @param {Object} options - { tier: 'fast'|'balanced'|'advanced', temperature, model }
     */
    async chat(messages, options = {}) {
        const modelName = this.resolveModel(options.tier || options.model || this.defaultTier);

        try {
            const response = await axios.post(`${this.baseURL}/api/chat`, {
                model: modelName,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.7,
                    top_p: options.top_p ?? 0.9,
                    num_ctx: options.contextLength ?? 4096,
                }
            }, { timeout: options.timeout ?? 120000 });

            return {
                content: response.data.message.content,
                model: modelName,
                done: response.data.done
            };
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('❌ Ollama is not running on this server. Run: ollama serve');
            }
            if (error.response?.status === 404) {
                throw new Error(`❌ Model "${modelName}" not found. Pull it with: ollama pull ${modelName}`);
            }
            throw new Error(`Ollama error: ${error.message}`);
        }
    }

    /**
     * Streaming chat — calls onChunk for each token
     */
    async chatStream(messages, options = {}, onChunk) {
        const modelName = this.resolveModel(options.tier || options.model || this.defaultTier);

        const response = await axios.post(`${this.baseURL}/api/chat`, {
            model: modelName,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
            options: { temperature: options.temperature ?? 0.7 }
        }, {
            responseType: 'stream',
            timeout: options.timeout ?? 120000
        });

        return new Promise((resolve, reject) => {
            let fullContent = '';
            response.data.on('data', (chunk) => {
                try {
                    const lines = chunk.toString().split('\n').filter(Boolean);
                    for (const line of lines) {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            fullContent += json.message.content;
                            if (onChunk) onChunk(json.message.content);
                        }
                    }
                } catch {}
            });
            response.data.on('end', () => resolve({ content: fullContent, model: modelName }));
            response.data.on('error', reject);
        });
    }

    // ─── Agentic Loop ──────────────────────────────────────────────────────────

    /**
     * Agentic execution — model reasons through a task with tool access.
     * Works like the Gemini agent loop, but fully local.
     * 
     * @param {string} prompt - User's task
     * @param {Object} aiTools - The existing aiTools utility (readFile, writeFile, runCommand, etc.)
     * @param {string} userId - User's MongoDB ID for file operations
     * @param {Object} options - { tier, maxLoops }
     */
    async runAgentLoop(prompt, aiTools, userId, options = {}) {
        const tier = options.tier || this.defaultAgentTier; // Default to expert for agent tasks
        const maxLoops = options.maxLoops || 8;

        const systemPrompt = `You are the Kevryn Local AI Agent — a powerful autonomous coding assistant running 100% on the local server (no internet needed).

You have access to these tools. To use a tool, respond with a JSON block in this exact format:
\`\`\`tool
{
  "tool": "TOOL_NAME",
  "args": { ... }
}
\`\`\`

Available Tools:
- readFile(path) — Read a file from the user's workspace
- writeFile(path, content) — Create or overwrite a file
- listFiles(directory) — List files in a directory  
- runCommand(command) — Execute a terminal command

Rules:
1. Always analyze the problem first, then act step by step
2. Read existing files before modifying them
3. After writing code, run it to verify it works
4. If a command fails, read the error and fix it autonomously
5. When done with ALL tasks, respond naturally without any tool block`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        let finalResponse = '';
        let loopCount = 0;

        while (loopCount < maxLoops) {
            loopCount++;
            console.log(`[Kevryn Local Agent] Loop ${loopCount}/${maxLoops} — Model: ${this.models[tier]?.name}`);

            const result = await this.chat(messages, { tier, temperature: 0.4, timeout: 180000 });
            const responseText = result.content;

            // Check if the model wants to use a tool
            const toolMatch = responseText.match(/```tool\s*([\s\S]*?)```/);

            if (!toolMatch) {
                // No tool call — agent is done
                finalResponse = responseText;
                break;
            }

            // Parse tool call
            let toolCall;
            try {
                toolCall = JSON.parse(toolMatch[1].trim());
            } catch (e) {
                console.error('[Local Agent] Failed to parse tool call:', toolMatch[1]);
                finalResponse = responseText;
                break;
            }

            // Execute the tool
            console.log(`[Local Agent] Executing tool: ${toolCall.tool}`, toolCall.args);
            let toolResult;
            try {
                toolResult = await aiTools.executeTool(toolCall.tool, toolCall.args, userId);
            } catch (toolError) {
                toolResult = { error: toolError.message };
            }

            // Feed result back into conversation
            messages.push({ role: 'assistant', content: responseText });
            messages.push({
                role: 'user',
                content: `Tool "${toolCall.tool}" result:\n\`\`\`\n${JSON.stringify(toolResult, null, 2)}\n\`\`\`\n\nContinue with the task.`
            });
        }

        if (!finalResponse && loopCount >= maxLoops) {
            finalResponse = 'Agent reached maximum loop limit. Partial work may have been completed.';
        }

        return { response: finalResponse, loops: loopCount, model: this.models[tier]?.name };
    }

    // ─── Convenience Helpers ───────────────────────────────────────────────────

    async explainCode(code, language, tier = 'balanced') {
        const result = await this.chat([
            { role: 'system', content: 'You are a helpful code assistant. Explain code clearly and concisely.' },
            { role: 'user', content: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
        ], { tier });
        return result.content;
    }

    async fixCode(code, language, error = '', tier = 'advanced') {
        const result = await this.chat([
            { role: 'system', content: 'You are an expert debugger. Find and fix bugs. Return the complete corrected code with explanation.' },
            { role: 'user', content: `Fix this ${language} code${error ? `\nError: ${error}` : ''}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn:\n1. Fixed code\n2. What was wrong\n3. How you fixed it` }
        ], { tier });
        return result.content;
    }

    async generateCode(description, language, tier = 'balanced') {
        const result = await this.chat([
            { role: 'system', content: `You are a code generator. Generate clean, working, well-commented ${language} code.` },
            { role: 'user', content: `Generate ${language} code for: ${description}` }
        ], { tier });
        return result.content;
    }

    async analyzeError(code, language, errorOutput, tier = 'advanced') {
        const result = await this.chat([
            { role: 'system', content: 'You are an expert debugger. Analyze errors and provide complete fixes.' },
            { role: 'user', content: `This ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProduced this error:\n\`\`\`\n${errorOutput}\n\`\`\`\n\nProvide:\n1. Root cause\n2. Complete fixed code\n3. Explanation` }
        ], { tier });
        return result.content;
    }

    async addComments(code, language, tier = 'balanced') {
        const result = await this.chat([
            { role: 'system', content: 'You are a documentation expert. Add clear, helpful comments to code.' },
            { role: 'user', content: `Add descriptive comments to this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn the code with helpful, professional comments.` }
        ], { tier });
        return result.content;
    }
}

module.exports = new OllamaService();
