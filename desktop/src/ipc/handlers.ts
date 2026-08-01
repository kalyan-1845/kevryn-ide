import { ipcMain, BrowserWindow, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { RuntimeManager } from '../runtime/RuntimeManager';
import { EnvironmentManager } from '../runtime/EnvironmentManager';

const CONFIG_FILE = path.join(app.getPath('userData'), 'kevryn_workspace.json');


export function setupIpcHandlers(mainWindow: BrowserWindow) {
    const runtimeManager = new RuntimeManager(mainWindow);

    ipcMain.handle('run-code', async (event, fileName: string, content?: string) => {
        return await runtimeManager.executeFile(fileName);
    });

    ipcMain.handle('get-env-status', () => {
        return EnvironmentManager.getStatus();
    });

    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    ipcMain.handle('get-workspace-path', async () => {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
                return JSON.parse(data).workspacePath || null;
            }
        } catch (e) {
            console.error('Error reading workspace path', e);
        }
        return null;
    });

    ipcMain.handle('save-workspace-path', async (event, workspacePath: string) => {
        try {
            await fs.promises.writeFile(CONFIG_FILE, JSON.stringify({ workspacePath }), 'utf-8');
            return true;
        } catch (e) {
            console.error('Error saving workspace path', e);
            return false;
        }
    });

    ipcMain.handle('read-local-dir', async (event, dirPath: string) => {
        try {
            const buildTree = async (currentPath: string, relativePath: string, depth = 0): Promise<any[]> => {
                if (depth > 4) return []; // Prevent massive hangs on huge directories
                
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                const promises = entries.map(async (entry) => {
                    // Skip hidden files/folders and node_modules for performance
                    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'System Volume Information') return null;
                    
                    const fullPath = path.join(currentPath, entry.name);
                    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                    
                    if (entry.isDirectory()) {
                        return {
                            _id: fullPath,
                            name: entry.name,
                            type: 'folder',
                            children: await buildTree(fullPath, relPath, depth + 1)
                        };
                    } else {
                        return {
                            _id: fullPath,
                            name: entry.name,
                            type: 'file'
                        };
                    }
                });
                
                const resolved = await Promise.all(promises);
                return resolved.filter(Boolean);
            };
            return await buildTree(dirPath, '');
        } catch (error: any) {
            console.error('Failed to read local dir:', error);
            throw error;
        }
    });

    ipcMain.handle('read-local-file', async (event, filePath: string) => {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        } catch (error: any) {
            console.error('Failed to read local file:', error);
            throw error;
        }
    });

    ipcMain.handle('write-local-file', async (event, filePath: string, content: string) => {
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return true;
        } catch (error: any) {
            console.error('Failed to write local file:', error);
            throw error;
        }
    });

    ipcMain.handle('create-local-item', async (event, targetPath: string, type: 'file' | 'folder') => {
        try {
            if (type === 'folder') {
                await fs.promises.mkdir(targetPath, { recursive: true });
            } else {
                await fs.promises.writeFile(targetPath, '', 'utf-8');
            }
            return { success: true };
        } catch (error: any) {
            console.error('Failed to create local item:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-local-item', async (event, targetPath: string) => {
        try {
            const stat = await fs.promises.stat(targetPath);
            if (stat.isDirectory()) {
                await fs.promises.rm(targetPath, { recursive: true, force: true });
            } else {
                await fs.promises.unlink(targetPath);
            }
            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete local item:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rename-local-item', async (event, oldPath: string, newPath: string) => {
        try {
            await fs.promises.rename(oldPath, newPath);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to rename local item:', error);
            return { success: false, error: error.message };
        }
    });
}
