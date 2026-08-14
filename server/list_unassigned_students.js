const mongoose = require('mongoose');
const User = require('./User');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find students
    const students = await User.find({ role: 'student' }).lean();
    
    console.log(`Found ${students.length} students total.`);
    
    const unassigned = students.filter(s => !s.department || !s.year || !s.section);
    console.log(`Found ${unassigned.length} students missing department/year/section assignments:`);
    
    unassigned.forEach(s => {
      console.log(`- Username/RollNo: ${s.username} | DB ID: ${s._id} | CollegeId: ${s.collegeId || 'NONE'}`);
    });
    
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
