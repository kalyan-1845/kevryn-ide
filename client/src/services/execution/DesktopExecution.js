export class DesktopExecution {
    async run(options) {
        console.log(`[DesktopExecution] Executing locally via KevRyn Native Runtime: ${options.fileName}`);
        
        if (!window.electronAPI) return;

        options.socketRef.current?.emit('run_start', { language: options.language });

        // Pipe the execution command directly into the Native PTY terminal
        // This makes it 100% interactive (scanf/cin works) and preserves history!
        const cmdString = `${options.cmd}\r`;
        window.electronAPI.terminalWrite(cmdString);
        
        // Immediately emit run_end since the terminal handles the lifecycle interactively
        setTimeout(() => {
            options.socketRef.current?.emit('run_end', { code: 0 });
        }, 1000);
    }
}
