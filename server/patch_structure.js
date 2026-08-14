const mongoose = require('mongoose');
const CollegeStructure = require('./models/CollegeStructure');
const College = require('./models/College');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const college = await College.findOne({ code: 'ACEEN-A5EC' });
        if (!college) {
            console.error("College ACEEN-A5EC not found.");
            process.exit(1);
        }

        const collegeId = college._id;

        // Update or insert CSE 3rd Year
        let structure = await CollegeStructure.findOne({ collegeId, department: 'CSE', year: '3' });
        
        const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        if (structure) {
            structure.sections = sections;
            await structure.save();
            console.log("Updated CSE Year 3 with sections A-G");
        } else {
            structure = new CollegeStructure({
                collegeId,
                department: 'CSE',
                year: '3',
                sections
            });
            await structure.save();
            console.log("Created CSE Year 3 with sections A-G");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
