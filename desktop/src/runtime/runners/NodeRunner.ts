import { spawn } from 'child_process';
import { BaseRunner } from '../LanguageRegistry';
import { EnvironmentManager } from '../EnvironmentManager';

import * as path from 'path';

export class NodeRunner implements BaseRunner {
    execute(fileName: string, onData: (data: string) => void, onExit: (code: number) => void) {
        const status = EnvironmentManager.getStatus();
        if (!status.node) {
            onData('\r\nError: Node.js is not installed on this system.\r\n');
            onExit(1);
            return;
        }

        const cwd = path.dirname(fileName);

        const spawnProcess = spawn('node', [`"${fileName}"`], {
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
