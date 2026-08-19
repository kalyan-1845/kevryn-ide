const express = require('express');
const router = express.Router();
const User = require('../User');
const DeveloperMetrics = require('../models/DeveloperMetrics');
const DevProfileSyncer = require('../services/DevProfileSyncer');
const { authenticate } = require('../utils/authMiddleware');

// 1. Save External Profiles (For Student Command Center)
router.put('/profiles', authenticate, async (req, res) => {
    try {
        const { github, leetcode, hackerrank, codechef } = req.body;
        
        // Find user by req.user.userId
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.externalProfiles) {
            user.externalProfiles = {};
        }

        if (github !== undefined) user.externalProfiles.github = github;
        if (leetcode !== undefined) user.externalProfiles.leetcode = leetcode;
        if (hackerrank !== undefined) user.externalProfiles.hackerrank = hackerrank;
        if (codechef !== undefined) user.externalProfiles.codechef = codechef;

        user.markModified('externalProfiles');
        await user.save();

        // Trigger background sync immediately when user updates profile
        DevProfileSyncer.syncUser(user._id).catch(e => console.error('Sync failed after profile update', e));

        res.json({ success: true, externalProfiles: user.externalProfiles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Fetch Advanced Tracking Data (Instantly from DB Cache)
router.get('/:identifier', authenticate, async (req, res) => {
    try {
        const identifier = req.params.identifier;
        
        // Find user by rollNumber or username
        const user = await User.findOne({ 
            $or: [{ username: identifier }, { rollNumber: identifier }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const profiles = user.externalProfiles || {};
        
        // Fetch cached metrics
        let metrics = await DeveloperMetrics.findOne({ userId: user._id });
        
        // If no metrics exist yet, trigger an initial sync and wait for it
        if (!metrics && (profiles.github || profiles.leetcode || profiles.hackerrank || profiles.codechef)) {
            metrics = await DevProfileSyncer.syncUser(user._id);
        }

        const responseData = {
            user: {
                username: user.username,
                rollNumber: user.rollNumber,
                role: user.role
            },
            github: { username: profiles.github, data: metrics?.github, error: metrics?.github?.errorMessage },
            leetcode: { username: profiles.leetcode, data: metrics?.leetcode, error: metrics?.leetcode?.errorMessage },
            hackerrank: { username: profiles.hackerrank, data: metrics?.hackerrank, error: metrics?.hackerrank?.errorMessage },
            codechef: { username: profiles.codechef, data: metrics?.codechef, error: metrics?.codechef?.errorMessage },
            lastSyncedAt: metrics?.lastSyncedAt || null
        };

        res.json(responseData);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Force Sync Live Data
router.post('/:identifier/sync', authenticate, async (req, res) => {
    try {
        const identifier = req.params.identifier;
        
        const user = await User.findOne({ 
            $or: [{ username: identifier }, { rollNumber: identifier }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const metrics = await DevProfileSyncer.syncUser(user._id);
        
        res.json({ success: true, lastSyncedAt: metrics?.lastSyncedAt });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
