import { BrowserWindow } from 'electron';
import { LanguageRegistry } from './LanguageRegistry';
import { TelemetryService } from './telemetry/TelemetryService';

export class RuntimeManager {
    private telemetry: TelemetryService;

    constructor(window: BrowserWindow) {
        this.telemetry = new TelemetryService(window);
    }

    async executeFile(fileName: string) {
        const language = LanguageRegistry.detectLanguage(fileName);
        if (!language) {
            this.telemetry.emitTerminalData(`Unsupported file type for execution: ${fileName}\r\n`);
            this.telemetry.emitExecutionEnd(1);
            return;
        }

        const runner = LanguageRegistry.getRunner(language);
        if (!runner) {
            this.telemetry.emitTerminalData(`Runner not implemented for: ${language}\r\n`);
            this.telemetry.emitExecutionEnd(1);
            return;
        }

        this.telemetry.emitTerminalData(`\r\n--- KevRyn Native Runtime ---\r\nExecuting ${fileName} locally...\r\n\r\n`);

        runner.execute(
            fileName,
            (data) => this.telemetry.emitTerminalData(data),
            (code) => {
                this.telemetry.emitTerminalData(`\r\n[Process exited with code ${code}]\r\n`);
                this.telemetry.emitExecutionEnd(code);
            }
        );
    }
}
