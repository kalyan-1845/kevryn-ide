const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    department: { type: String, required: true }, // e.g., 'CSE'
    year: { type: String, required: true },       // e.g., '3'
    name: { type: String, required: true },       // e.g., 'Java Programming Lab'
    code: { type: String, required: true },       // e.g., 'CS301'
    credits: { type: Number, default: 2 },
    description: { type: String, default: '' },
    
    // Optional curriculum mapping
    curriculumType: { type: String, default: 'JNTUH' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Enforce unique course code per college
CourseSchema.index({ collegeId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', CourseSchema);
