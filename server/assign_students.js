const mongoose = require('mongoose');
const User = require('./User');
require('dotenv').config();

// Generate the sequence of all possible suffixes
let suffixes = [];
// 1. 01 to 99
for (let i = 1; i <= 99; i++) {
    suffixes.push(i.toString().padStart(2, '0'));
}
// 2. A0 to Z9
for (let charCode = 65; charCode <= 90; charCode++) {
    for (let digit = 0; digit <= 9; digit++) {
        suffixes.push(String.fromCharCode(charCode) + digit.toString());
    }
}
// 3. AA to ZZ
for (let char1 = 65; char1 <= 90; char1++) {
    for (let char2 = 65; char2 <= 90; char2++) {
        suffixes.push(String.fromCharCode(char1) + String.fromCharCode(char2));
    }
}

function getRange(prefix, startSuffix, endSuffix) {
    const startIndex = suffixes.indexOf(startSuffix);
    const endIndex = suffixes.indexOf(endSuffix);
    if (startIndex === -1 || endIndex === -1) {
        throw new Error(`Invalid suffix: ${startSuffix} or ${endSuffix}`);
    }
    
    let range = [];
    for (let i = startIndex; i <= endIndex; i++) {
        range.push(prefix + suffixes[i]);
    }
    return range;
}

// Generate expected roll numbers for each section
const mappings = [
    {
        section: 'A',
        rolls: [
            ...getRange('24AG1A05', '01', '65'),
            ...getRange('25AG5A05', '01', '07')
        ]
    },
    {
        section: 'B',
        rolls: [
            ...getRange('24AG1A05', '66', 'C9'),
            ...getRange('25AG5A05', '08', '12')
        ]
    },
    {
        section: 'C',
        rolls: [
            ...getRange('24AG1A05', 'D0', 'J3'),
            ...getRange('25AG5A05', '15', '21')
        ]
    },
    {
        section: 'D',
        rolls: [
            ...getRange('24AG1A05', 'J4', 'P7'),
            ...getRange('25AG5A05', '22', '28')
        ]
    },
    {
        section: 'E',
        rolls: [
            ...getRange('24AG1A05', 'P8', 'W1'),
            ...getRange('25AG5A05', '29', '34')
        ]
    },
    {
        section: 'F',
        rolls: [
            ...getRange('24AG1A05', 'W2', 'Z9'),
            ...getRange('24AG1A05', 'AA', 'AZ'),
            ...getRange('25AG5A05', '35', '40')
        ]
    },
    {
        section: 'G',
        rolls: [
            ...getRange('24AG1A05', 'BA', 'DL'),
            ...getRange('25AG5A05', '41', '48')
        ]
    }
];

// Create a quick lookup map: rollNumber -> section
const rollNumberToSection = {};
mappings.forEach(mapObj => {
    mapObj.rolls.forEach(roll => {
        rollNumberToSection[roll.toUpperCase()] = mapObj.section;
    });
});

const College = require('./models/College');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const college = await College.findOne({ code: 'ACEEN-A5EC' });
        if (!college) {
            throw new Error("College ACEEN-A5EC not found in DB.");
        }
        const collegeId = college._id;

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} total students.`);

        let updatedCount = 0;

        for (const student of students) {
            const roll = student.rollNumber ? student.rollNumber.toUpperCase() : student.username.toUpperCase();
            const sectionAssigned = rollNumberToSection[roll];

            if (sectionAssigned) {
                // Determine if we need to update
                if (
                    student.department !== 'CSE' ||
                    student.year !== '3' ||
                    student.section !== sectionAssigned ||
                    String(student.collegeId) !== String(collegeId)
                ) {
                    student.department = 'CSE';
                    student.year = '3';
                    student.section = sectionAssigned;
                    student.collegeId = collegeId;
                    
                    await student.save();
                    updatedCount++;
                    console.log(`Updated ${roll} -> CSE, Year 3, Section ${sectionAssigned}`);
                }
            } else {
                // If it's a student not in our lists, just warn
                if (!student.section) {
                    console.log(`Skipped unmapped roll number: ${roll}`);
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} students.`);
    } catch (err) {
        console.error("Error during execution:", err);
    } finally {
        mongoose.disconnect();
    }
}

run();
