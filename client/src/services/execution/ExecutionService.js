import { BrowserExecution } from './BrowserExecution';
import { DesktopExecution } from './DesktopExecution';

export class ExecutionService {
    static async run(options) {
        const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;
        
        // If we have a courseId, we are strictly inside a Lab environment (Cloud Sync Mode).
        // General IDE mode uses DesktopExecution natively.
        const isLabMode = !!options.courseId;
        
        const strategy = (isDesktop && !isLabMode)
            ? new DesktopExecution() 
            : new BrowserExecution();
            
        await strategy.run(options);
    }
}
