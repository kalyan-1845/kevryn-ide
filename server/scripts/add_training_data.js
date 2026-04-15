const fs = require('fs');
const path = require('path');

/**
 * add_training_data.js
 * Usage: node add_training_data.js "Instruction" "Response"
 */

const instruction = process.argv[2];
const output = process.argv[3];

if (!instruction || !output) {
    console.error("❌ Usage: node add_training_data.js \"What is X?\" \"X is Y.\"");
    process.exit(1);
}

const dataPath = path.join(__dirname, '../data/dataset.jsonl');
const newEntry = JSON.stringify({ instruction, input: "", output }) + "\n";

fs.appendFileSync(dataPath, newEntry);
console.log(`✅ Success! Added new training pair to ${dataPath}`);
console.log(`Total pairs now: ${fs.readFileSync(dataPath, 'utf8').split('\n').filter(Boolean).length}`);
