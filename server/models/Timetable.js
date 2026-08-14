const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    department: { type: String, required: true }, // e.g., 'CSE'
    year: { type: String, required: true },       // e.g., '3'
    section: { type: String, required: true },    // e.g., 'D'
    subjectName: { type: String, required: true },// e.g., 'Data Structures Lab'
    subjectCode: { type: String },                // e.g., 'CS301'
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: { type: String, required: true },  // Format: 'HH:MM' (24-hour) e.g., '09:30'
    endTime: { type: String, required: true },    // Format: 'HH:MM' e.g., '12:30'
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for fast querying by faculty or student sections
TimetableSchema.index({ facultyId: 1, dayOfWeek: 1 });
TimetableSchema.index({ department: 1, year: 1, section: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
