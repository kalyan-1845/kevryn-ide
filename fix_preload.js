const fs = require('fs');
let content = fs.readFileSync('desktop/src/preload/index.ts', 'utf8');
content = content.replace(
    'onAgentChatChunk: (agentId: string, callback: (chunk: string) => void) => {',
    'onAgentChatChunk: (agentId: string, callback: (chunk: string) => void) => {\n        ipcRenderer.removeAllListeners(`agent-chat-chunk-${agentId}`);'
);
content = content.replace(
    'onAgentChatDone: (agentId: string, callback: () => void) => {',
    'onAgentChatDone: (agentId: string, callback: () => void) => {\n        ipcRenderer.removeAllListeners(`agent-chat-done-${agentId}`);'
);
content = content.replace(
    'onAgentChatError: (agentId: string, callback: (error: string) => void) => {',
    'onAgentChatError: (agentId: string, callback: (error: string) => void) => {\n        ipcRenderer.removeAllListeners(`agent-chat-error-${agentId}`);'
);
fs.writeFileSync('desktop/src/preload/index.ts', content);
