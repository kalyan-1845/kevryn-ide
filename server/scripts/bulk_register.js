const bcrypt = require('bcryptjs');
const User = require('../User');
const College = require('../models/College');

async function runBulkRegistration() {
    try {
        console.log('[BULK REGISTRATION] Starting...');
        
        const collegeCode = 'ACEEN-A5EC';
        let college = await College.findOne({ code: collegeCode });
        if (!college) {
            console.log(`[BULK REGISTRATION] College ${collegeCode} not found, creating...`);
            college = new College({
                name: 'ACE Engineering College',
                code: collegeCode
            });
            await college.save();
        }

        const usersToCreate = [];

        // Generate 24AG1A05[J4-P7]
        for (let i = 104; i <= 167; i++) {
            const letter = String.fromCharCode(64 + Math.floor(i / 10));
            const digit = i % 10;
            const username = `24AG1A05${letter}${digit}`;
            usersToCreate.push(username);
        }

        // Generate 25AG5A05[22-28]
        for (let i = 22; i <= 28; i++) {
            const username = `25AG5A05${i}`;
            usersToCreate.push(username);
        }

        console.log(`[BULK REGISTRATION] Prepared to process ${usersToCreate.length} students...`);
        let created = 0;
        let existed = 0;

        for (const username of usersToCreate) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                if (!existingUser.collegeId || existingUser.collegeId.toString() !== college._id.toString()) {
                    existingUser.collegeId = college._id;
                    await existingUser.save();
                }
                existed++;
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(username, salt);

            const newUser = new User({
                username: username,
                password: hashedPassword,
                role: 'student',
                collegeId: college._id
            });
            await newUser.save();
            created++;
        }

        console.log(`[BULK REGISTRATION] Complete! Created: ${created}, Already existed: ${existed}`);
    } catch (err) {
        console.error('[BULK REGISTRATION] Error:', err);
    }
}

module.exports = runBulkRegistration;
