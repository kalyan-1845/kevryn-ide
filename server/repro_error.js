const ollamaService = require('./services/ollamaService');

async function test() {
    try {
        console.log("Testing Cloud AI Chat...");
        const result = await ollamaService.chat([{ role: 'user', content: 'hi' }], { tier: 'fast' });
        console.log("Result:", result);
    } catch (e) {
        console.error("CAUGHT ERROR:", e);
        console.error("STACK:", e.stack);
    }
}

test();
