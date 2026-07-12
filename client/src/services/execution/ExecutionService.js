import { BrowserExecution } from './BrowserExecution';
import { DesktopExecution } from './DesktopExecution';

export class ExecutionService {
    static async run(options) {
        const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;
        
        const strategy = isDesktop 
            ? new DesktopExecution() 
            : new BrowserExecution();
            
        await strategy.run(options);
    }
}
