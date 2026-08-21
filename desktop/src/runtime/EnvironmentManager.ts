import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class EnvironmentManager {
    private static status: Record<string, boolean> = {
        python: false,
        node: false,
        java: false,
        gcc: false,
        git: false,
        docker: false
    };

    static async detectAll() {
        this.status.python = await this.checkCommand('python --version') || await this.checkCommand('python3 --version');
        this.status.node = await this.checkCommand('node -v');
        this.status.java = await this.checkCommand('java -version');
        this.status.gcc = await this.checkCommand('gcc --version');
        this.status.git = await this.checkCommand('git --version');
        this.status.docker = await this.checkCommand('docker --version');
        
        console.log('[EnvironmentManager] Detected Tools:', this.status);
    }

    private static async checkCommand(command: string): Promise<boolean> {
        try {
            await execAsync(command);
            return true;
        } catch {
            return false;
        }
    }

    static getStatus() {
        return this.status;
    }
}
