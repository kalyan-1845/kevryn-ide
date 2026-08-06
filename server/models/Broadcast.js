const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null }, // null = All Colleges
    collegeName: { type: String, default: 'All Colleges (Global)' },
    targetRole: { type: String, enum: ['all', 'student', 'faculty'], default: 'all' },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    createdByName: { type: String, default: 'Admin' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Broadcast', broadcastSchema);
