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

            let finalSecret = secret;

            if (secret === 'oauth-flow-request') {
                // Simulate OAuth flow exactly like VS Code
                finalSecret = await new Promise<string | null>((resolve) => {
                    const authWindow = new BrowserWindow({
                        width: 500, height: 600, show: false,
                        webPreferences: { nodeIntegration: false, contextIsolation: true },
                        autoHideMenuBar: true, title: 'Sign In to AI Provider'
                    });

                    // Build a mock OAuth consent screen
                    const html = `
                        <html><body style="font-family: sans-serif; padding: 40px; text-align: center; background: #fff; color: #333;">
                            <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" width="60" />
                            <h2>Sign in to Google</h2>
                            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">KevRyn IDE is requesting access to use your personal Gemini API limits.</p>
                            <input type="password" id="key" placeholder="Paste your Google AI Studio API Key" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 20px; font-size: 14px;" />
                            <button onclick="submit()" style="background: #1a73e8; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; font-weight: bold;">Authorize & Continue</button>
                            <script>
                                function submit() {
                                    const val = document.getElementById('key').value;
                                    if(val) document.title = "AUTH_SUCCESS:" + val;
                                }
                            </script>
                        </body></html>
                    `;

                    authWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
                    authWindow.once('ready-to-show', () => authWindow.show());

                    authWindow.on('page-title-updated', (e, title) => {
                        if (title.startsWith('AUTH_SUCCESS:')) {
                            const key = title.split(':')[1];
                            authWindow.close();
                            resolve(key);
                        }
                    });

                    authWindow.on('closed', () => resolve(null));
                });
            }

            if (!finalSecret) return false; // Cancelled
            
            // Store securely
            await this.credManager.storeCredential(agentId, finalSecret);
            
            // Attempt to auth
            const success = await agent.authenticate({ apiKey: finalSecret });
            return success;
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
