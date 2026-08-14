const mongoose = require('mongoose');

const LabRoomSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    name: { type: String, required: true }, // e.g., 'Lab-1', 'Lab-2'
    capacity: { type: Number, default: 60 },
    building: { type: String, default: 'Main Block' },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

LabRoomSchema.index({ collegeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LabRoom', LabRoomSchema);
