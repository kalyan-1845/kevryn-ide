import { ipcMain, BrowserWindow } from 'electron';
import { AgentExtension, AgentStatus } from './AgentExtension';
import { AgentCredentialManager } from './AgentCredentialManager';

// We will dynamically load these later, for now we inject them
export class AgentManager {
    private mainWindow: BrowserWindow;
    private credManager: AgentCredentialManager;
    private registry: Map<string, AgentExtension> = new Map();

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.credManager = new AgentCredentialManager();
    }

    public registerAgent(agent: AgentExtension) {
        const id = agent.getManifest().id;
        this.registry.set(id, agent);
    }

    public setupIpc() {
        ipcMain.handle('agent-list', () => {
            return Array.from(this.registry.values()).map(agent => ({
                manifest: agent.getManifest(),
                status: agent.getStatus()
            }));
        });

        ipcMain.handle('agent-authenticate', async (event, agentId: string, secret: string) => {
            const agent = this.registry.get(agentId);
            if (!agent) return false;

            let finalSecret: string | null = secret;
            if (!finalSecret) return false;
            
            // Store securely
            await this.credManager.storeCredential(agentId, finalSecret);
            
            // Attempt to auth
            const success = await agent.authenticate({ apiKey: finalSecret });
            return success;
        });

        ipcMain.handle('agent-signout', async (event, agentId: string) => {
            const agent = this.registry.get(agentId);
            if (!agent) return false;
            await this.credManager.deleteCredential(agentId);
            agent.dispose(); // Sets status back to NOT_INSTALLED
            await agent.install(); // Sets status to AUTH_REQUIRED
            return true;
        });

        // The actual chat stream
        ipcMain.handle('agent-chat', async (event, agentId: string, message: string, context: any) => {
            const agent = this.registry.get(agentId);
            if (!agent) throw new Error("Agent not found");

            // For IPC streams, Electron's invoke doesn't support AsyncGenerators directly.
            // We must use event emitting back to the renderer.
            try {
                const stream = agent.sendChat(message, context);
                for await (const chunk of stream) {
                    this.mainWindow.webContents.send(`agent-chat-chunk-${agentId}`, chunk);
                }
                this.mainWindow.webContents.send(`agent-chat-done-${agentId}`);
            } catch (e: any) {
                this.mainWindow.webContents.send(`agent-chat-error-${agentId}`, e.message);
            }
        });
    }

    public async initializeAgents() {
        // Attempt to auto-auth existing agents
        for (const [id, agent] of this.registry.entries()) {
            const secret = await this.credManager.getCredential(id);
            if (secret) {
                await agent.authenticate({ apiKey: secret });
            }
        }
    }
}
