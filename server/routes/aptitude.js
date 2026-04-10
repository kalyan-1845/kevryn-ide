const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../utils/authMiddleware');
const AptitudeTest = require('../models/AptitudeTest');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const User = require('../User'); // To check if student exists
const Batch = require('../models/Batch');

const { Groq } = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 

// ==========================================
// FACULTY API
// ==========================================

router.post('/create', authenticate, async (req, res) => {
    try {
        const { title, description, duration, batches, questions, totalMarks } = req.body;
        
        const test = new AptitudeTest({
            facultyId: req.user.userId,
            collegeId: req.user.collegeId || undefined,
            title,
            description,
            duration,
            batches,
            questions,
            totalMarks
        });
        
        await test.save();
        res.json({ success: true, test });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/faculty/tests', authenticate, async (req, res) => {
    try {
        const tests = await AptitudeTest.find({ facultyId: req.user.userId }).populate('batches', 'name').sort({ createdAt: -1 });
        res.json({ tests });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// The "Magical Upload": Smart parser using Groq to parse messy text
router.post('/upload-parse', authenticate, async (req, res) => {
    try {
        const { rawText } = req.body;
        if (!rawText) return res.status(400).json({ error: 'No text provided' });

        const prompt = `
        You are an intelligent test orchestrator. Parse the following pasted text into a structured JSON array of questions for an Aptitude Test.
        Identify the question text, options (if multiple choice), the correct answer(s), and guess the type ('mcq', 'multi-correct', 'fill', or 'code').
        Return ONLY valid JSON output, strictly following this exact format:
        [
          {
            "text": "What is 2+2?",
            "type": "mcq",
            "options": ["3", "4", "5", "6"],
            "correctAnswers": ["4"],
            "points": 1
          }
        ]
        
        RAW TEXT:
        ${rawText}
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-70b-8192',
            temperature: 0.1, // Strict parsing
            response_format: { type: 'json_object' } // Force JSON
        });

        const content = completion.choices[0]?.message?.content;
        let questions = JSON.parse(content);
        
        // Handle if groq wraps it in an object like { questions: [...] }
        if (!Array.isArray(questions) && questions.questions) {
            questions = questions.questions;
        }

        res.json({ success: true, parsedQuestions: questions });
    } catch (e) {
        res.status(500).json({ error: 'Failed to magically parse text. Ensure it is readable or try formatting slightly. Details: ' + e.message });
    }
});

// Start Exam
router.post('/:id/start', authenticate, async (req, res) => {
    try {
        const testId = req.params.id;
        const test = await AptitudeTest.findOne({ _id: testId, facultyId: req.user.userId });
        
        if (!test) return res.status(404).json({ error: 'Test not found' });
        
        test.isActive = true;
        test.startTime = new Date();
        await test.save();
        
        // Emitting globally or just via polling, but students will pick this up
        res.json({ success: true, test });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// End Exam Early
router.post('/:id/end', authenticate, async (req, res) => {
    try {
        const testId = req.params.id;
        const test = await AptitudeTest.findOne({ _id: testId, facultyId: req.user.userId });
        
        if (!test) return res.status(404).json({ error: 'Test not found' });
        
        test.isActive = false;
        test.endTime = new Date();
        await test.save();
        
        res.json({ success: true, test });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// STUDENT API
// ==========================================

// Poll for active exams targeting student's batch(es)
router.get('/student/active', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const username = req.user.username;

        // Find which batches the student is enrolled in
        const batches = await Batch.find({ 'students.username': username }).select('_id');
        const batchIds = batches.map(b => b._id);

        if (batchIds.length === 0) return res.json({ session: null });

        // Build query
        const query = { isActive: true, batches: { $in: batchIds } };
        if (req.user.collegeId) query.collegeId = req.user.collegeId;

        const session = await AptitudeTest.findOne(query).sort({ startTime: -1 }).populate('questions'); // Need questions for the exam (without answers)

        if (session && session.duration) {
            const now = new Date();
            const expiresAt = new Date(session.startTime.getTime() + session.duration * 60 * 1000);
            if (now > expiresAt) {
                session.isActive = false;
                session.endTime = new Date();
                await session.save();
                return res.json({ session: null });
            }
        }

        if(!session) return res.json({ session: null });

        // Scrub correct answers before sending to student!
        const scrubbedTest = session.toObject();
        scrubbedTest.questions.forEach(q => {
            delete q.correctAnswers;
        });

        res.json({ session: scrubbedTest });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Log Telemetry (Tab Switch, FullScreen exit)
router.post('/telemetry', authenticate, async (req, res) => {
    try {
        const { testId, event, details } = req.body;
        
        // Update Test live telemetry
        await AptitudeTest.findByIdAndUpdate(testId, {
            $push: {
                liveTelemetry: {
                    username: req.user.username,
                    event,
                    details,
                    timestamp: new Date()
                }
            }
        });
        
        // Update Submission violation count if it exists, or create placeholder
        let sub = await AptitudeSubmission.findOne({ testId, studentId: req.user.userId });
        if (!sub) {
            sub = new AptitudeSubmission({
                testId,
                studentId: req.user.userId,
                username: req.user.username,
                answers: [],
                tabSwitches: 0,
                fullScreenExits: 0,
                pasteViolations: 0
            });
        }
        
        if (event === 'tab-switch') sub.tabSwitches += 1;
        if (event === 'fullscreen-exit') sub.fullScreenExits += 1;
        if (event === 'paste-detect') sub.pasteViolations += 1;

        if (sub.tabSwitches >= 3) {
            sub.isAutoSubmitted = true; // Flag for UI enforcement/kicking
        }

        await sub.save();

        res.json({ success: true, violations: sub.tabSwitches });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit Exam
router.post('/submit', authenticate, async (req, res) => {
    try {
        const { testId, answers, isAutoSubmitted } = req.body; // Answers format: { questionId: '123', providedAnswers: ["A"] }
        
        const test = await AptitudeTest.findById(testId);
        if (!test) return res.status(404).json({ error: "Test not found" });

        let totalScore = 0;
        const gradedAnswers = answers.map(ans => {
            const q = test.questions.id(ans.questionId);
            if(!q) return { ...ans, isCorrect: false, pointsEarned: 0 };
            
            // Compare answers
            // Simplistic exact match for arrays (JSON.stringify sorting might be better but assuming single text/MCQ for now)
            const providedSorted = [...ans.providedAnswers].sort();
            const correctSorted = [...q.correctAnswers].sort();
            
            const isCorrect = JSON.stringify(providedSorted) === JSON.stringify(correctSorted);
            const pointsEarned = isCorrect ? q.points : 0;
            totalScore += pointsEarned;

            return {
                questionId: ans.questionId,
                providedAnswers: ans.providedAnswers,
                isCorrect,
                pointsEarned
            };
        });

        let sub = await AptitudeSubmission.findOne({ testId, studentId: req.user.userId });
        if(sub && sub.answers.length > 0) return res.status(400).json({ error: 'Already submitted' });

        if(!sub) {
            sub = new AptitudeSubmission({
                testId,
                studentId: req.user.userId,
                username: req.user.username,
                tabSwitches: 0,
                fullScreenExits: 0,
                pasteViolations: 0
            });
        }

        sub.answers = gradedAnswers;
        sub.totalScore = totalScore;
        sub.isAutoSubmitted = isAutoSubmitted || false;
        sub.submittedAt = new Date();

        await sub.save();

        res.json({ success: true, score: totalScore, autoSubmitted: sub.isAutoSubmitted });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- STUDENT: GET TEST HISTORY & RESULTS ---
router.get('/student/history', authenticate, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const submissions = await AptitudeSubmission.find({ studentId })
            .populate('testId')
            .sort({ submittedAt: -1 });

        const history = submissions.map(sub => ({
            _id: sub.testId?._id,
            title: sub.testId?.title,
            startTime: sub.submittedAt,
            duration: sub.testId?.duration,
            submission: {
                score: sub.totalScore,
                maxScore: sub.testId?.questions?.reduce((acc, q) => acc + (q.points || 1), 0)
            }
        }));

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all submissions for a specific test (Faculty)
router.get('/:id/submissions', authenticate, async (req, res) => {
    try {
        const testId = req.params.id;
        // Verify test belongs to faculty
        const test = await AptitudeTest.findOne({ _id: testId, facultyId: req.user.userId });
        if (!test) return res.status(404).json({ error: 'Test not found' });

        const submissions = await AptitudeSubmission.find({ testId })
            .select('username studentId totalScore submittedAt answers tabSwitches fullScreenExits pasteViolations')
            .sort({ submittedAt: -1 });
        
        res.json({ success: true, submissions });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
