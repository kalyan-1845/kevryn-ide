const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const runTestCase = (cmd, args, input, expectedOutput, timeout = 2000) => {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args);
        let stdout = '';
        let stderr = '';
        let killed = false;

        const timer = setTimeout(() => {
            proc.kill();
            killed = true;
            resolve({ pass: false, output: 'Timeout', error: 'Execution timed out' });
        }, timeout);

        if (input) {
            proc.stdin.write(input);
        }
        proc.stdin.end();

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            clearTimeout(timer);
            if (killed) return;

            const actual = stdout.trim();
            const expected = expectedOutput.trim();
            const pass = actual === expected;

            resolve({
                pass,
                input,
                expected: expected,
                actual: actual,
                error: stderr,
                executionTime: 'N/A' // Could add timing
            });
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            resolve({ pass: false, output: '', error: err.message });
        });
    });
};

const { execSync } = require('child_process');

const runAutoGrader = async (code, language, testCases) => {
    const tmpDir = path.join(os.tmpdir(), `submission_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    let ext = 'txt';
    if (language === 'python') ext = 'py';
    else if (language === 'javascript' || language === 'node') ext = 'js';
    else if (language === 'c') ext = 'c';
    else if (language === 'cpp') ext = 'cpp';
    else if (language === 'java') ext = 'java';

    let fileName = `submission.${ext}`;
    let className = '';
    if (language === 'java') {
        const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        className = match ? match[1] : 'Main';
        fileName = `${className}.java`;
    }

    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, code);

    const results = [];
    let cmd = '';
    let args = [];

    try {
        if (language === 'c' || language === 'cpp') {
            const outPath = path.join(tmpDir, 'output');
            const compiler = language === 'c' ? 'gcc' : 'g++';
            try {
                execSync(`${compiler} "${filePath}" -o "${outPath}"`, { stdio: 'pipe' });
            } catch (err) {
                return [{ pass: false, error: "Compilation Error:\n" + (err.stderr ? err.stderr.toString() : err.message) }];
            }
            cmd = outPath;
            args = [];
        } else if (language === 'java') {
            try {
                execSync(`javac "${filePath}"`, { stdio: 'pipe' });
            } catch (err) {
                return [{ pass: false, error: "Compilation Error:\n" + (err.stderr ? err.stderr.toString() : err.message) }];
            }
            cmd = 'java';
            args = ['-cp', tmpDir, className];
        } else if (language === 'python') {
            cmd = 'python';
            args = [filePath];
        } else if (language === 'javascript' || language === 'node') {
            cmd = 'node';
            args = [filePath];
        } else {
            return [{ pass: false, error: "Unsupported language" }]; // Wrap in array to prevent .map() crash
        }

        for (const tc of testCases) {
            const result = await runTestCase(cmd, args, tc.input, tc.expectedOutput);
            results.push({
                ...result,
                isHidden: tc.isHidden,
                points: tc.points
            });
        }
    } catch (e) {
        console.error("AutoGrader Error:", e);
        return [{ pass: false, error: "AutoGrader System Error: " + e.message }];
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    return results;
};

module.exports = { runAutoGrader };
