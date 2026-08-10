const express = require('express');
const router = express.Router();
const User = require('../User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { authenticate } = require('../utils/authMiddleware');

const checkPrincipal = async (req, res, next) => {
    try {
        if (req.user.role !== 'college_admin') {
            return res.status(403).json({ error: "Access denied. College admin only." });
        }
        if (!req.user.collegeId) {
            return res.status(400).json({ error: "No college associated with this admin." });
        }
        next();
    } catch (e) {
        res.status(500).json({ error: "Authorization error" });
    }
};

router.use(authenticate, checkPrincipal);

// GET /stats
router.get('/stats', async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const totalStudents = await User.countDocuments({ collegeId, role: 'student' });
        const totalFaculty = await User.countDocuments({ collegeId, role: 'faculty' });
        
        const students = await User.find({ collegeId, role: 'student' }).select('username');
        const studentUsernames = students.map(s => s.username);
        const totalSubmissions = await Submission.countDocuments({ studentUsername: { $in: studentUsernames } });

        res.json({ totalStudents, totalFaculty, totalSubmissions });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        // Assuming xp or aptitude fields exist on the User model
        const leaderboard = await User.find({ collegeId, role: 'student' })
            .select('-password')
            .sort({ xp: -1, aptitudeScore: -1 })
            .limit(50);
            
        res.json(leaderboard);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /faculty-activity
router.get('/faculty-activity', async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const facultyMembers = await User.find({ collegeId, role: 'faculty' }).select('username email _id');
        
        const activity = await Promise.all(facultyMembers.map(async (faculty) => {
            const courseCount = await Course.countDocuments({ facultyId: faculty._id });
            // For assignment count, we can check by courseId or facultyId depending on the schema.
            // Let's assume Assignment has facultyId, or if it doesn't we can just find courses and query assignments by courseId.
            // Since we aren't 100% sure about Assignment schema, querying by courseId is safer if facultyId is missing.
            const courses = await Course.find({ facultyId: faculty._id }).select('_id');
            const courseIds = courses.map(c => c._id);
            const assignmentCount = await Assignment.countDocuments({ courseId: { $in: courseIds } });
            
            return {
                _id: faculty._id,
                username: faculty.username,
                email: faculty.email,
                courseCount,
                assignmentCount
            };
        }));
        
        res.json(activity);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
