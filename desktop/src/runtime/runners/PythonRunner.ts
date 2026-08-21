import { spawn } from 'child_process';
import { BaseRunner } from '../LanguageRegistry';
import { EnvironmentManager } from '../EnvironmentManager';

import * as path from 'path';

export class PythonRunner implements BaseRunner {
    execute(fileName: string, onData: (data: string) => void, onExit: (code: number) => void) {
        const status = EnvironmentManager.getStatus();
        if (!status.python) {
            onData('\r\nError: Python is not installed on this system.\r\n');
            onExit(1);
            return;
        }

        const cmd = process.platform === 'win32' ? 'python' : 'python3';
        const cwd = path.dirname(fileName);

        const spawnProcess = spawn(cmd, [`"${fileName}"`], {
            cwd: cwd,
            shell: true,
            env: process.env as Record<string, string>
        });
        spawnProcess.stdout.on('data', (data) => {
            onData(data.toString().replace(/\n/g, '\r\n'));
        });
        
        spawnProcess.stderr.on('data', (data) => {
            onData(data.toString().replace(/\n/g, '\r\n'));
        });

        spawnProcess.on('close', (code) => {
            onExit(code ?? 0);
        });
    }
}
