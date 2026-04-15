const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, '../data/neural_keys.json');

/**
 * Ensures the keys storage exists
 */
if (!fs.existsSync(path.dirname(KEYS_FILE))) {
    fs.mkdirSync(path.dirname(KEYS_FILE), { recursive: true });
}
if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys: [] }, null, 2));
}

/**
 * Generate a new Kevryn API Key 🔑
 */
const generateKey = (name = 'Default Project') => {
    const key = `KEVRYN-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    const keysData = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    
    const newEntry = {
        name,
        key,
        createdAt: new Date().toISOString(),
        usage: 0
    };
    
    keysData.keys.push(newEntry);
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keysData, null, 2));
    
    return newEntry;
};

/**
 * Validate a Kevryn API Key
 */
const validateKey = (key) => {
    const keysData = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    const found = keysData.keys.find(k => k.key === key);
    
    if (found) {
        found.usage += 1;
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keysData, null, 2));
        return true;
    }
    return false;
};

const listKeys = () => {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')).keys;
};

const deleteKey = (key) => {
    let keysData = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    keysData.keys = keysData.keys.filter(k => k.key !== key);
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keysData, null, 2));
};

module.exports = {
    generateKey,
    validateKey,
    listKeys,
    deleteKey
};
