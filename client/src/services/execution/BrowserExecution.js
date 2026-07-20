export class BrowserExecution {
    async run(options) {
        console.log(`[BrowserExecution] Executing via Server PTY: ${options.cmd}`);
        
        const ext = options.fileName.split('.').pop()?.toLowerCase();
        const serverLangs = ['c', 'cpp', 'java', 'py', 'js', 'ts', 'rb', 'go', 'php', 'sh', 'bash'];
        const isServerLang = serverLangs.includes(ext || '');

        if (isServerLang) {
            options.socketRef.current?.emit('terminal:write', {
                termId: options.termId || 'server-1',
                data: options.cmd + '\r\n',
                courseId: options.courseId
            });

            try {
                const res = await options.api.post('/run-code', { 
                    code: options.code, 
                    language: options.language, 
                    fileName: options.fileName 
                });
                if (res.data && res.data.output !== undefined) {
                    await options.api.put(`/files/${options.activeFileId}`, { 
                        lastRunOutput: res.data.output || res.data.error || 'Ran successfully (no output)',
                        lastRunTime: new Date()
                    });
                }
            } catch (err) {
                console.error("[BrowserExecution] Background execution recording failed:", err);
            }
        } else {
            const targetTermId = options.termId || 1;
            const inputWriter = window.ideTerminalInputs && window.ideTerminalInputs[targetTermId];
            if (inputWriter) {
                await inputWriter.write(options.cmd + '\r\n');
            } else {
                options.socketRef.current?.emit('terminal:write', {
                    termId: targetTermId,
                    data: options.cmd + '\r\n',
                    courseId: options.courseId
                });
            }
        }
    }
}
