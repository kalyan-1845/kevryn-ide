const mongoose = require('mongoose');

const AptitudeQuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'multi-correct', 'tf', 'fill', 'code'], default: 'mcq' },
    options: [{ type: String }], // Array of strings for MCQ options
    correctAnswers: [{ type: String }], // Array for multi-correct or exact match strings for fill-in-blanks
    points: { type: Number, default: 1 }
});

const AptitudeTestSchema = new mongoose.Schema({
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, default: Date.now },
    duration: { type: Number, default: 60 }, // Duration in minutes
    endTime: Date,
    isActive: { type: Boolean, default: false }, // Will be set to true when Faculty explicitly Starts the exam
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }], // Associated batches to dictate who gets the Live Exam banner
    questions: [AptitudeQuestionSchema], // Embedded questions
    totalMarks: { type: Number, default: 0 },
    
    // Strict Proctoring Telemetry
    // Tracking violations live for faculty monitoring
    liveTelemetry: [{
        username: String,
        event: { type: String, enum: ['tab-switch', 'fullscreen-exit', 'paste-detect', 'kick', 'auto-submit'] },
        timestamp: { type: Date, default: Date.now },
        details: String
    }]
}, { timestamps: true });

// Indexes for fast fetching of active tests by targeted batches
AptitudeTestSchema.index({ isActive: 1, batches: 1 });
AptitudeTestSchema.index({ facultyId: 1, createdAt: -1 });

module.exports = mongoose.model('AptitudeTest', AptitudeTestSchema);
