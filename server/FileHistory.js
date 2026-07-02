const mongoose = require('mongoose');

const FileHistorySchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    content: { type: String, default: "" },
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who made the edit
});

// PERFORMANCE FIX: Prevent Full Collection Scans which caused OOMs on auto-save
FileHistorySchema.index({ fileId: 1, savedAt: -1 });

module.exports = mongoose.model('FileHistory', FileHistorySchema);