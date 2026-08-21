import { BrowserWindow } from 'electron';

export class TelemetryService {
    constructor(private window: BrowserWindow) {}

    emitTerminalData(data: string) {
        this.window.webContents.send('terminal-data', data);
    }

    emitExecutionEnd(code: number) {
        this.window.webContents.send('execution-end', code);
    }
}
