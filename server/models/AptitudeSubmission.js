const mongoose = require('mongoose');

const AptitudeSubmissionSchema = new mongoose.Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTest', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        providedAnswers: [{ type: String }],
        isCorrect: { type: Boolean, default: false },
        pointsEarned: { type: Number, default: 0 }
    }],
    totalScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    isAutoSubmitted: { type: Boolean, default: false }, // True if they were kicked out due to violations or time expired
    
    // Violation Aggregates for Grading Decisions
    tabSwitches: { type: Number, default: 0 },
    fullScreenExits: { type: Number, default: 0 },
    pasteViolations: { type: Number, default: 0 }
});

// Enforce one submission per test per student
AptitudeSubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AptitudeSubmission', AptitudeSubmissionSchema);
