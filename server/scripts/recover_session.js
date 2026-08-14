require('dotenv').config();
const mongoose = require('mongoose');
const LabSession = require('../LabSessionModel');
const File = require('../File');
const User = require('../User'); // Mongoose throws if User is not required

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.\n");

    const session = await LabSession.findOne().sort({startTime: -1});
    if (!session) {
        console.log("No lab session found.");
        process.exit(0);
    }
    
    console.log(`Recovering Session: ${session.sessionName} (${session._id})`);
    console.log(`Start Time: ${session.startTime}`);
    console.log(`End Time: ${session.endTime}`);

    // Find files created or updated during this session
    const sessionFiles = await File.find({
        $or: [
            { createdAt: { $gte: session.startTime, $lte: session.endTime || new Date() } },
            { updatedAt: { $gte: session.startTime, $lte: session.endTime || new Date() } }
        ]
    }).populate('owner', 'username');

    console.log(`Found ${sessionFiles.length} file activity records during this session.`);

    const attendedUsernames = new Set();
    sessionFiles.forEach(f => {
        if (f.owner && f.owner.username) {
            attendedUsernames.add(f.owner.username);
        }
    });

    console.log(`Unique students with file activity: ${attendedUsernames.size}`);

    let addedCount = 0;
    for (const username of attendedUsernames) {
        const exists = session.activeStudents.find(s => s.username === username);
        if (!exists) {
            session.activeStudents.push({
                username: username,
                loginTime: session.startTime,
                lastHeartbeat: session.endTime || new Date(),
                currentStatus: 'offline',
                tabSwitchCount: 0,
                pasteCount: 0,
                attentionScore: 100
            });
            addedCount++;
            console.log(`[+] Added ${username} to attended students.`);
        }
    }

    if (addedCount > 0) {
        await session.save();
        console.log(`\nSuccessfully recovered ${addedCount} students into the session report.`);
    } else {
        console.log(`\nNo missing students needed to be recovered (or no file activity found).`);
    }

    process.exit(0);
}

run().catch(console.error);
