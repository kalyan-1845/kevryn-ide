const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Mongoose Models
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    role: { type: String, default: 'student' },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });
const User = mongoose.model('User', UserSchema);

const CollegeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
}, { strict: false });
const College = mongoose.model('College', CollegeSchema);

// The 69 Transcribed Roll Numbers
const students = [
    // Left Column (1-36)
    "24AG1A05BA", "24AG1A05BB", "24AG1A05BC", "24AG1A05BD", "24AG1A05BE", 
    "24AG1A05BG", "24AG1A05BH", "24AG1A05BI", "24AG1A05BJ", "24AG1A05BK", 
    "24AG1A05BL", "24AG1A05BM", "24AG1A05BN", "24AG1A05BO", "24AG1A05BP", 
    "24AG1A05BQ", "24AG1A05BR", "24AG1A05BT", "24AG1A05BU", "24AG1A05BV", 
    "24AG1A05BW", "24AG1A05BX", "24AG1A05BY", "24AG1A05BZ", "24AG1A05CA", 
    "24AG1A05CB", "24AG1A05CC", "24AG1A05CD", "24AG1A05CE", "24AG1A05CF", 
    "24AG1A05CG", "24AG1A05CH", "24AG1A05CI", "24AG1A05CJ", "24AG1A05CK", 
    "24AG1A05CL",

    // Right Column (37-62)
    "24AG1A05CM", "24AG1A05CN", "24AG1A05CO", "24AG1A05CP", "24AG1A05CQ", 
    "24AG1A05CR", "24AG1A05CS", "24AG1A05CT", "24AG1A05CU", "24AG1A05CV", 
    "24AG1A05CW", "24AG1A05CX", "24AG1A05CY", "24AG1A05CZ", "24AG1A05DA", 
    "24AG1A05DB", "24AG1A05DC", "24AG1A05DD", "24AG1A05DE", "24AG1A05DF", 
    "24AG1A05DG", "24AG1A05DH", "24AG1A05DI", "24AG1A05DJ", "24AG1A05DK", 
    "24AG1A05DL",

    // Re-Admission (63)
    "23AG1A05B3",

    // Lateral Entry (64-69)
    "25AG5A0541", "25AG5A0542", "25AG5A0543", "25AG5A0544", "25AG5A0545", 
    "25AG5A0546"
];

const TARGET_COLLEGE_CODE = "ACEEN-A5EC";

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.\n");

    console.log(`Looking up college with code: ${TARGET_COLLEGE_CODE}...`);
    const college = await College.findOne({ code: TARGET_COLLEGE_CODE });
    
    if (!college) {
        console.error(`FATAL ERROR: College with code ${TARGET_COLLEGE_CODE} was not found in the database.`);
        process.exit(1);
    }
    
    console.log(`Found College: ID = ${college._id}`);
    console.log(`Starting registration for ${students.length} students...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const rollNo of students) {
        try {
            const existingUser = await User.findOne({ username: rollNo });
            if (existingUser) {
                console.log(`[SKIPPED] ${rollNo} already exists.`);
                skipCount++;
                continue;
            }

            // Hash the roll number to use as the password
            const hashedPassword = await bcrypt.hash(rollNo, 10);

            const newUser = new User({
                username: rollNo,
                password: hashedPassword,
                collegeId: college._id,
                role: 'student'
            });

            await newUser.save();
            console.log(`[SUCCESS] Registered ${rollNo}`);
            successCount++;
        } catch (err) {
            console.error(`[ERROR] Failed to register ${rollNo}:`, err.message);
            errorCount++;
        }
    }

    console.log(`\n--- Registration Summary ---`);
    console.log(`Total Students: 69`);
    console.log(`Successfully Registered: ${successCount}`);
    console.log(`Skipped (Already Existed): ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    
    mongoose.connection.close();
    console.log("Done.");
}

run();
