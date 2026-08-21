import { PythonRunner } from './runners/PythonRunner';
import { NodeRunner } from './runners/NodeRunner';
import { CRunner } from './runners/CRunner';
import { JavaRunner } from './runners/JavaRunner';

export interface BaseRunner {
    execute(fileName: string, onData: (data: string) => void, onExit: (code: number) => void): void;
}

export class LanguageRegistry {
    private static runners: Record<string, any> = {
        'python': PythonRunner,
        'javascript': NodeRunner,
        'c': CRunner,
        'cpp': CRunner,
        'java': JavaRunner
    };

    static getRunner(language: string): BaseRunner | null {
        const RunnerClass = this.runners[language.toLowerCase()];
        return RunnerClass ? new RunnerClass() : null;
    }

    static detectLanguage(fileName: string): string | null {
        if (fileName.endsWith('.py')) return 'python';
        if (fileName.endsWith('.js')) return 'javascript';
        if (fileName.endsWith('.c')) return 'c';
        if (fileName.endsWith('.cpp')) return 'cpp';
        if (fileName.endsWith('.java')) return 'java';
        return null;
    }
}
