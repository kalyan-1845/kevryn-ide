const mongoose = require('mongoose');

const CollegeStructureSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    department: { type: String, required: true }, // e.g., 'CSE', 'IT', 'ECE'
    year: { type: String, required: true },       // e.g., '1', '2', '3', '4'
    sections: [{ type: String }],                 // e.g., ['A', 'B', 'C', 'D']
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Enforce unique Department + Year per college
CollegeStructureSchema.index({ collegeId: 1, department: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('CollegeStructure', CollegeStructureSchema);
