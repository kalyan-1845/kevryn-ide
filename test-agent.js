require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiTools = require('./server/utils/aiTools');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testAgent() {
    try {
        console.log("Key length:", (process.env.GEMINI_API_KEY || '').length);
        const toolsDefinition = [{ functionDeclarations: aiTools.getGeminiToolDeclarations() }];
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: toolsDefinition
        });

        let dbHistory = [];
        dbHistory.unshift({
            role: 'user',
            parts: [{ text: "You are the Kevryn Autonomous Agent. You have the ability to read and write files directly. If the user asks for a React UI, create the files using your tools." }]
        });
        dbHistory.push({ role: 'model', parts: [{ text: "Understood. I will use my tools autonomously." }] });

        console.log("History:", JSON.stringify(dbHistory, null, 2));
        
        const chat = model.startChat({ history: dbHistory });

        console.log("Sending message...");
        const result = await chat.sendMessage("hey hi");
        const response = result.response;
        
        const functionCalls = response.functionCalls();
        console.log("Function calls:", functionCalls);
        console.log("Text:", response.text());

    } catch (e) {
        console.error("Crash:", e);
    }
}

testAgent();
