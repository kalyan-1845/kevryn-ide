const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentUsername: { type: String, required: true },

    // Student's Solution
    submittedCode: { type: String, default: '' },

    // Auto-Grading Results
    testResults: [{
        testCaseIndex: Number,
        pass: Boolean,
        actualOutput: String,
        error: String
    }],

    score: { type: Number, default: 0 }, // Calculated based on test cases
    maxScore: { type: Number, default: 100 },

    status: {
        type: String,
        enum: ['draft', 'submitted', 'graded', 'returned'],
        default: 'draft'
    },

    // Proctoring & Tracking (NEW)
    timeSpentSeconds: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0 },
    fullScreenExits: { type: Number, default: 0 },

    submittedAt: { type: Date },
    gradedAt: { type: Date }
});

// PERFORMANCE: Indexes for fast scoping
SubmissionSchema.index({ assignmentId: 1 });
SubmissionSchema.index({ collegeId: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
