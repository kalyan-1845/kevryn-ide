const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * GoldWorkspace Manager
 * 
 * Handles "Instant-Run" by linking user projects to a pre-warmed 
 * Global Cache of dependencies (React, NumPy, etc.)
 */
class GoldWorkspace {
    constructor(baseDir) {
        const os = require('os');
        const kevrynDir = path.join(os.homedir(), '.kevryn');
        this.globalCache = process.env.KEVRYN_CACHE || path.join(kevrynDir, 'global_cache');
        this.userProjects = process.env.KEVRYN_WORKSPACES || path.join(kevrynDir, 'workspaces');
        
        // Ensure directories exist
        fs.ensureDirSync(this.globalCache);
        fs.ensureDirSync(this.userProjects);
    }

    /**
     * Initializes a project with "Magic" symlinks to the global cache.
     * @param {string} userId - User identifier
     * @param {string} projectType - react, python, c, etc.
     * @param {string} targetDir - Optional custom directory (like a tmpDir)
     */
    async initializeMagicProject(userId, projectType, targetDir = null) {
        const projectDir = targetDir || path.join(this.userProjects, userId);
        await fs.ensureDir(projectDir);

        console.log(`[GOLD] Initializing ${projectType} in ${projectDir}...`);

        if (projectType === 'react' || projectType === 'web' || projectType === 'javascript') {
            const globalNodeModules = path.join(this.globalCache, 'node_modules');
            const targetNodeModules = path.join(projectDir, 'node_modules');
            
            // Create a symlink to the global node_modules if it exists
            if (await fs.pathExists(globalNodeModules)) {
                if (!(await fs.pathExists(targetNodeModules))) {
                    try {
                        console.log(`[GOLD] Creating Magic Symlink: ${globalNodeModules} -> ${targetNodeModules}`);
                        // Use 'junction' for Windows compatibility and better performance
                        await fs.symlink(globalNodeModules, targetNodeModules, 'junction');
                    } catch (err) {
                        console.error(`[GOLD] Symlink failed (might already exist or permission issue):`, err.message);
                    }
                }
            }
        }

        if (projectType === 'python' || projectType === 'ai') {
            // Python handles this via site-packages, but we can ensure a venv is pre-linked
            console.log(`[GOLD] Python environment inherited from Global Server Image.`);
        }

        return projectDir;
    }

    /**
     * Runs a pre-installation of the core "World" dependencies.
     * This is the "One-time setup" the user requested.
     */
    async setupWorld() {
        console.log(`[GOLD] Training the World Cache... This may take a few minutes.`);
        
        // 1. Install Node World
        try {
            await execAsync('npm install react react-dom next tailwindcss framer-motion lucide-react express mongoose axios', {
                cwd: this.globalCache
            });
            console.log(`[GOLD] Node World: Ready.`);
        } catch (e) {
            console.error(`[GOLD] Node World Error:`, e.message);
        }

        // 2. Install Python World
        try {
            await execAsync('pip install numpy pandas scikit-learn fastapi uvicorn django flask requests', {
                cwd: this.globalCache
            });
            console.log(`[GOLD] Python World: Ready.`);
        } catch (e) {
            console.error(`[GOLD] Python World Error:`, e.message);
        }
    }
}

module.exports = new GoldWorkspace(process.cwd());
