const express = require('express');
const router = express.Router();
const Broadcast = require('../models/Broadcast');
const College = require('../models/College');
const { authenticate } = require('../utils/authMiddleware');

// Admin-only middleware
const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
};

// 1. POST /api/admin/broadcast — Publish New Broadcast (Emits socket event in < 100ms)
router.post('/admin/broadcast', authenticate, checkAdmin, async (req, res) => {
    try {
        const { title, message, collegeId, targetRole, priority, createdByName } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "Title and message are required" });
        }

        let collegeName = "All Colleges (Global)";
        if (collegeId) {
            const college = await College.findById(collegeId);
            if (college) collegeName = college.name;
        }

        const broadcast = new Broadcast({
            title,
            message,
            collegeId: collegeId || null,
            collegeName,
            targetRole: targetRole || 'all',
            priority: priority || 'normal',
            createdByName: createdByName || 'Bhoompally Kalyan Reddy (Founder & CEO)'
        });

        await broadcast.save();

        // 🚀 INSTANT REAL-TIME SOCKET EMISSION (< 100ms delivery to students/faculty)
        const io = req.app.get('io');
        if (io) {
            io.emit('global-broadcast', broadcast);
            console.log(`[BROADCAST] Emitted live announcement "${title}" to room global-broadcast`);
        }

        res.json({ message: "Broadcast published successfully!", broadcast });
    } catch (e) {
        console.error("Broadcast creation error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. GET /api/broadcasts/active — Get Active Broadcasts for current user
router.get('/broadcasts/active', authenticate, async (req, res) => {
    try {
        const userCollegeId = req.user.collegeId || null;
        const userRole = req.user.role || 'student';

        // Query active broadcasts where:
        // - collegeId is null (Global) OR collegeId matches user's collegeId
        // - targetRole is 'all' OR targetRole matches user's role
        const query = {
            isActive: true,
            $or: [
                { collegeId: null },
                { collegeId: userCollegeId }
            ],
            $and: [
                {
                    $or: [
                        { targetRole: 'all' },
                        { targetRole: userRole }
                    ]
                }
            ]
        };

        const activeBroadcasts = await Broadcast.find(query).sort({ createdAt: -1 }).limit(5);
        res.json(activeBroadcasts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. GET /api/admin/broadcasts — List All Broadcasts (Admin view)
router.get('/admin/broadcasts', authenticate, checkAdmin, async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(30);
        res.json(broadcasts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. DELETE /api/admin/broadcasts/:id — Dismiss / Deactivate Broadcast
router.delete('/admin/broadcasts/:id', authenticate, checkAdmin, async (req, res) => {
    try {
        const broadcast = await Broadcast.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!broadcast) return res.status(404).json({ error: "Broadcast not found" });

        const io = req.app.get('io');
        if (io) {
            io.emit('global-broadcast-dismissed', { id: req.params.id });
        }

        res.json({ message: "Broadcast dismissed", broadcast });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
