import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { app, BrowserWindow } from 'electron';
import * as chokidar from 'chokidar';

export interface WorkspaceContext {
    workspaceId: string;
    rootPath: string;
    name: string;
}

export class WorkspaceManager {
    private activeWorkspace: WorkspaceContext | null = null;
    private watcher: chokidar.FSWatcher | null = null;
    private mainWindow: BrowserWindow;
    private userDataPath: string;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.userDataPath = app.getPath('userData');
    }

    private generateWorkspaceId(rootPath: string): string {
        return crypto.createHash('sha256').update(rootPath).digest('hex').substring(0, 16);
    }

    public async openFolder(targetPath: string): Promise<WorkspaceContext | null> {
        try {
            const stat = await fs.promises.stat(targetPath);
            if (!stat.isDirectory()) {
                throw new Error("Target is not a directory");
            }

            // Close existing workspace properly
            this.closeWorkspace();

            const workspaceId = this.generateWorkspaceId(targetPath);
            this.activeWorkspace = {
                workspaceId,
                rootPath: targetPath,
                name: path.basename(targetPath)
            };

            // Setup watcher for this workspace
            this.setupWatcher(targetPath);

            // Persist the active workspace
            await this.saveGlobalState(targetPath);

            return this.activeWorkspace;
        } catch (e) {
            console.error("Failed to open workspace folder", e);
            return null;
        }
    }

    public closeWorkspace() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        this.activeWorkspace = null;
    }

    private setupWatcher(rootPath: string) {
        this.watcher = chokidar.watch(rootPath, {
            ignored: [/(^|[\/\\])\../, /node_modules/, /dist/], // Ignore hidden, node_modules, dist by default
            persistent: true,
            ignoreInitial: true,
            depth: 99
        });

        this.watcher
            .on('add', (filePath) => this.notifyEvent('file-added', filePath))
            .on('change', (filePath) => this.notifyEvent('file-changed', filePath))
            .on('unlink', (filePath) => this.notifyEvent('file-deleted', filePath))
            .on('addDir', (dirPath) => this.notifyEvent('dir-added', dirPath))
            .on('unlinkDir', (dirPath) => this.notifyEvent('dir-deleted', dirPath));
    }

    private notifyEvent(event: string, itemPath: string) {
        if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('workspace-event', { event, itemPath });
        }
    }

    public getActiveWorkspace(): WorkspaceContext | null {
        return this.activeWorkspace;
    }

    public async readDirectory(dirPath: string) {
        if (!this.activeWorkspace) throw new Error("No active workspace");
        if (!dirPath.startsWith(this.activeWorkspace.rootPath)) {
            throw new Error("Path traversal violation");
        }

        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        const nodes = entries.map(entry => {
            const fullPath = path.join(dirPath, entry.name);
            return {
                _id: fullPath,
                name: entry.name,
                type: entry.isDirectory() ? 'folder' : 'file'
            };
        });

        // Sort: folders first, then files
        return nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
    }

    private async saveGlobalState(workspacePath: string) {
        const configPath = path.join(this.userDataPath, 'kevryn_workspace.json');
        await fs.promises.writeFile(configPath, JSON.stringify({ workspacePath }), 'utf-8');
    }
}
