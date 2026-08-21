import { AgentExtension, AgentStatus, ExtensionManifest } from '../../core/AgentExtension';

export class GeminiAdapter implements AgentExtension {
    private status: AgentStatus = 'NOT_INSTALLED';
    private apiKey: string | null = null;

    getManifest(): ExtensionManifest {
        return {
            id: 'google-gemini',
            name: 'Google Gemini',
            publisher: 'KevRyn',
            version: '1.0.0',
            description: 'Advanced AI Agent powered by Google Gemini 1.5 Pro',
            capabilities: ['chat', 'workspace-read', 'terminal-execute']
        };
    }

    getStatus(): AgentStatus {
        return this.status;
    }

    async install(): Promise<boolean> {
        this.status = 'AUTH_REQUIRED';
        return true;
    }

    async authenticate(credentials: any): Promise<boolean> {
        if (credentials.apiKey) {
            this.apiKey = credentials.apiKey;
            this.status = 'AUTHENTICATED';
            return true;
        }
        return false;
    }

    async launch(): Promise<void> {
        if (this.status === 'AUTHENTICATED') {
            this.status = 'RUNNING';
        }
    }

    async stop(): Promise<void> {
        if (this.status === 'RUNNING') {
            this.status = 'AUTHENTICATED';
        }
    }

    async *sendChat(message: string, context: any): AsyncGenerator<string, void, unknown> {
        if (this.status !== 'RUNNING') {
            await this.launch();
        }

        // Mock response for now until we integrate @google/genai SDK
        yield "Hello! I am Google Gemini. ";
        yield "You said: " + message;
        yield "\nWorkspace Context: " + (context?.workspaceRoot || "None");
    }

    dispose(): void {
        this.apiKey = null;
        this.status = 'NOT_INSTALLED';
    }
}
