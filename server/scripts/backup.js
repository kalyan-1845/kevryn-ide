const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kevryn_ide';
const BACKUP_DIR = path.join(__dirname, '../backups');

async function backup() {
    try {
        console.log('[BACKUP] Connecting to database...');
        await mongoose.connect(MONGO_URI);
        
        const date = new Date();
        const folderName = date.toISOString().split('T')[0] + '_' + date.getHours() + '-' + date.getMinutes();
        const targetDir = path.join(BACKUP_DIR, folderName);
        
        await fs.ensureDir(targetDir);
        
        const collections = await mongoose.connection.db.collections();
        
        console.log(\[BACKUP] Found \ collections. Exporting...\);
        
        for (let collection of collections) {
            const data = await collection.find({}).toArray();
            const filePath = path.join(targetDir, \\.json\);
            await fs.writeJson(filePath, data, { spaces: 2 });
            console.log(\  -> Saved \ (\ records)\);
        }
        
        console.log('[BACKUP] SUCCESS! All data backed up to: ' + targetDir);
    } catch (err) {
        console.error('[BACKUP ERROR]', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

backup();
