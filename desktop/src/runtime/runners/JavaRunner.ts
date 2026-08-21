import { spawn } from 'child_process';
import { BaseRunner } from '../LanguageRegistry';
import * as path from 'path';

export class JavaRunner implements BaseRunner {
    execute(fileName: string, onData: (data: string) => void, onExit: (code: number) => void): void {
        const parsed = path.parse(fileName);
        const cwd = parsed.dir;
        
        onData(`\x1b[33mCompiling ${fileName}...\x1b[0m\r\n`);
        
        // Step 1: Compile
        const compile = spawn('javac', [`"${fileName}"`], { cwd, shell: true });
        
        compile.stdout.on('data', (data) => onData(data.toString().replace(/\n/g, '\r\n')));
        compile.stderr.on('data', (data) => onData(`\x1b[31m${data.toString().replace(/\n/g, '\r\n')}\x1b[0m`));
        
        compile.on('close', (code) => {
            if (code !== 0) {
                onData(`\x1b[31mCompilation failed with code ${code}\x1b[0m\r\n`);
                onExit(code ?? 1);
                return;
            }
            
            onData(`\x1b[32mCompilation successful. Running...\x1b[0m\r\n\r\n`);
            
            // Step 2: Execute
            const run = spawn('java', [`"${parsed.name}"`], { shell: true, cwd });
            
            run.stdout.on('data', (data) => onData(data.toString().replace(/\n/g, '\r\n')));
            run.stderr.on('data', (data) => onData(`\x1b[31m${data.toString().replace(/\n/g, '\r\n')}\x1b[0m`));
            
            run.on('close', (runCode) => onExit(runCode ?? 0));
        });
    }
}
