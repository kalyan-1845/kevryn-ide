const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const User = require('../User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { authenticate } = require('../utils/authMiddleware');
const { runAutoGrader } = require('../utils/autoGrader');

// 1. Create Assignment (Faculty Only)
router.post('/', authenticate, async (req, res) => {
    try {
        const { courseId, batchId, title, description, language, starterCode, testCases, points, dueDate } = req.body;

        // Verify Faculty Role
        if (req.user.role !== 'faculty') return res.status(403).json({ error: "Only faculty can create assignments" });

        // Verify Course Ownership & College
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (course.facultyId.toString() !== req.user.userId) return res.status(403).json({ error: "Unauthorized for this course" });
        if (req.user.collegeId && course.collegeId && course.collegeId.toString() !== req.user.collegeId.toString()) return res.status(403).json({ error: "Course belongs to another college" });

        const newAssignment = new Assignment({
            collegeId: req.user.collegeId || undefined,
            courseId,
            batchId: batchId || undefined,
            title,
            description,
            language,
            starterCode,
            testCases,
            maxPoints: points,
            dueDate
        });

        await newAssignment.save();

        // Broadcast to clients
        const io = req.app.get('io');
        if (io) {
            io.emit('assignment-created', {
                assignmentId: newAssignment._id,
                title: newAssignment.title,
                courseId: newAssignment.courseId,
                batchId: newAssignment.batchId
            });
        }

        res.json({ success: true, assignment: newAssignment });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Get Assignments for a Course
router.get('/course/:courseId', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });
        // Scoping
        if (req.user.collegeId && course.collegeId && course.collegeId.toString() !== req.user.collegeId.toString()) {
            return res.status(403).json({ error: "Unauthorized access to this college's data" });
        }

        const assignments = await Assignment.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Get Specific Assignment
router.get('/:id', authenticate, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('courseId');
        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        // Scoping
        if (req.user.collegeId && assignment.courseId.collegeId && assignment.courseId.collegeId.toString() !== req.user.collegeId.toString()) {
            return res.status(403).json({ error: "Unauthorized access to this college's data" });
        }

        res.json(assignment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Run Tests (Draft/Check)
router.post('/:id/run-tests', authenticate, async (req, res) => {
    try {
        const { code, language } = req.body;
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        // Run auto-grader
        const results = await runAutoGrader(code, language || assignment.language, assignment.testCases);

        // Hide hidden test cases from results if specific flag is set? 
        const sanitizedResults = results.map(r => {
            if (r.isHidden) return { ...r, input: 'Hidden', expected: 'Hidden', actual: r.pass ? 'Hidden' : 'Hidden', error: r.pass ? null : 'Failed Hidden Test' };
            return r;
        });

        res.json({ results: sanitizedResults });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Submit Assignment
router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const { code, language } = req.body;
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        // Run auto-grader
        const results = await runAutoGrader(code, language || assignment.language, assignment.testCases);

        // Calculate Score
        let totalPoints = 0;
        let earnedPoints = 0;

        assignment.testCases.forEach((tc, index) => {
            totalPoints += tc.points;
            if (results[index] && results[index].pass) {
                earnedPoints += tc.points;
            }
        });

        // Create/Update Submission
        const customMax = assignment.maxPoints || 100;
        const scaledScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * customMax) : 0;

        const submission = await Submission.findOneAndUpdate(
            { assignmentId: assignment._id, studentUsername: req.user.username },
            {
                submittedCode: code,
                testResults: results.map((r, i) => ({
                    testCaseIndex: i,
                    pass: r.pass,
                    actualOutput: r.actual || '',
                    error: r.error || ''
                })),
                score: scaledScore,
                maxScore: customMax,
                status: 'submitted',
                submittedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, submission, results });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 7. Get Submissions for a specific student in a course
router.get('/course/:courseId/student/:username', authenticate, async (req, res) => {
    try {
        const assignments = await Assignment.find({ courseId: req.params.courseId });
        const assignmentIds = assignments.map(a => a._id);

        const submissions = await Submission.find({
            assignmentId: { $in: assignmentIds },
            studentUsername: req.params.username
        }).populate('assignmentId', 'title maxPoints');

        res.json(submissions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5.5 Update Assignment
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'faculty') return res.status(403).json({ error: "Unauthorized" });
        
        const { title, description, language, starterCode, testCases, points, dueDate, batchId } = req.body;
        
        const updated = await Assignment.findByIdAndUpdate(req.params.id, {
            title,
            description,
            language,
            starterCode,
            testCases,
            maxPoints: points,
            dueDate,
            batchId: batchId || null
        }, { new: true });
        
        if (!updated) return res.status(404).json({ error: "Assignment not found" });
        res.json({ message: "Assignment updated successfully", assignment: updated });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6. Get All Submissions for a Course (Gradebook)
router.get('/course/:courseId/submissions', authenticate, async (req, res) => {
    try {
        // 1. Get all assignments for this course
        const assignments = await Assignment.find({ courseId: req.params.courseId });
        const assignmentIds = assignments.map(a => a._id);

        // 2. Get all submissions for these assignments
        const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
            .populate('assignmentId', 'title maxPoints') // Populate assignment details
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 8. Get all assignments for all courses a student is enrolled in (for Student Dashboard)
router.get('/student/active', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ error: "Only students can view their active assignments globally" });
        // Find courses and batches student is enrolled in
        const user = await User.findById(req.user.userId);
        const enrolledBatches = user.enrolledBatches || [];

        const courses = await Course.find({ enrolledStudents: req.user.username });
        const courseIds = courses.map(c => c._id);

        // Find assignments for those courses, restricted by batch if applicable
        const assignments = await Assignment.find({ 
            courseId: { $in: courseIds },
            $or: [
                { batchId: null },
                { batchId: { $exists: false } },
                { batchId: { $in: enrolledBatches } }
            ]
        })
            .populate('courseId', 'name')
            .sort({ dueDate: 1 }); // Sort by due date (closest first)

        // Fetch submissions to filter out completed ones
        const assignmentIds = assignments.map(a => a._id);
        const submissions = await Submission.find({ 
            assignmentId: { $in: assignmentIds },
            studentUsername: req.user.username
        });
        
        const submittedAssignmentIds = submissions.map(s => s.assignmentId.toString());
        const unsubmittedAssignments = assignments.filter(a => !submittedAssignmentIds.includes(a._id.toString()));

        res.json(unsubmittedAssignments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
