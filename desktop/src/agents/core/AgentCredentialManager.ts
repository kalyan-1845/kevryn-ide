import { safeStorage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class AgentCredentialManager {
    private storePath: string;

    constructor() {
        this.storePath = path.join(app.getPath('userData'), 'agent_credentials.json');
    }

    private getStore(): Record<string, string> {
        if (!fs.existsSync(this.storePath)) return {};
        try {
            return JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
        } catch (e) {
            return {};
        }
    }

    private saveStore(store: Record<string, string>) {
        fs.writeFileSync(this.storePath, JSON.stringify(store), 'utf-8');
    }

    public async storeCredential(agentId: string, secret: string): Promise<boolean> {
        try {
            if (!safeStorage.isEncryptionAvailable()) {
                console.warn('System encryption not available, storing plaintext (NOT RECOMMENDED)');
                const store = this.getStore();
                store[agentId] = Buffer.from(secret).toString('base64'); // Obfuscate if no encryption
                this.saveStore(store);
                return true;
            }

            const encrypted = safeStorage.encryptString(secret);
            const store = this.getStore();
            store[agentId] = encrypted.toString('base64');
            this.saveStore(store);
            return true;
        } catch (e) {
            console.error('Failed to store credential', e);
            return false;
        }
    }

    public async getCredential(agentId: string): Promise<string | null> {
        try {
            const store = this.getStore();
            const storedValue = store[agentId];
            if (!storedValue) return null;

            if (!safeStorage.isEncryptionAvailable()) {
                return Buffer.from(storedValue, 'base64').toString('utf-8');
            }

            return safeStorage.decryptString(Buffer.from(storedValue, 'base64'));
        } catch (e) {
            console.error('Failed to retrieve credential', e);
            return null;
        }
    }

    public async deleteCredential(agentId: string): Promise<void> {
        const store = this.getStore();
        delete store[agentId];
        this.saveStore(store);
    }
}
