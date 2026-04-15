const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use your existing Master API Key
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBu9urHeQLzgfWhkgBJkJLu7ZmxrDRl1nY';
const genAI = new GoogleGenerativeAI(API_KEY);

async function generateData() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const dataPath = path.join(__dirname, '../data/dataset.jsonl');

    console.log("🚀 Starting Expert Data Generation... This will take a moment.");

    const prompt = `You are an AI Data Engineer. I need to train a custom Llama-3.1 model to be an "Expert Personal Coding Agent" inside the Kevryn IDE.
    
    Generate 50 high-quality training pairs in JSONL format. 
    Each pair must have "instruction", "input" (can be empty), and "output".
    
    Mix these categories:
    1. 20% Kevryn Architecture (Beast UI, MongoDB files, Render cloud setup).
    2. 40% Expert Coding Tasks (Writing complex React components, Node.js optimization, debugging crashes).
    3. 20% Smart Problem Solving (Logic puzzles, algorithmic efficiency).
    4. 20% Advanced Tool Use (How to use runCommand to deploy or test code).
    
    Format example:
    {"instruction": "Write a React hook for managing global state in a Beast UI app.", "input": "", "output": "..."}
    
    Return ONLY the JSONL lines. No explanations.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Append to our dataset
        fs.appendFileSync(dataPath, text + "\n");
        console.log(`✅ Success! Added ~50 expert examples to ${dataPath}`);
    } catch (error) {
        console.error("❌ Generation Failed:", error.message);
    }
}

generateData();
