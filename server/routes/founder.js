const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/authMiddleware');
const { verifyDualOTP, getFounderCode, requireDualOTP, CRITICAL_ACTIONS } = require('../utils/dualKeyOTP');

/**
 * Founder OTP Routes
 * These routes handle the Dual-Key Founder authentication system.
 */

// Middleware: Only founders (admins) can access these routes
const checkFounder = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only founders can access this endpoint' });
    }
    next();
};

/**
 * GET /founder/my-code/:founderNumber
 * 
 * Each founder calls this to see their own 3-digit code.
 * Founder 1 (Kalyan) calls: GET /founder/my-code/1
 * Founder 2 (Ravi Raj) calls: GET /founder/my-code/2
 * 
 * They then share their codes over a phone call to combine into 6 digits.
 */
router.get('/my-code/:founderNumber', authenticate, checkFounder, (req, res) => {
    const founderNum = parseInt(req.params.founderNumber);

    if (founderNum !== 1 && founderNum !== 2) {
        return res.status(400).json({ error: 'Founder number must be 1 or 2' });
    }

    const code = getFounderCode(founderNum);
    const validUntil = new Date(
        (Math.floor(Date.now() / (5 * 60 * 1000)) + 1) * (5 * 60 * 1000)
    );

    res.json({
        founderNumber: founderNum,
        code: code,
        validUntil: validUntil.toISOString(),
        message: `Share this code with the other founder over a secure channel (phone call). Combined 6-digit OTP is required for critical actions.`
    });
});

/**
 * POST /founder/verify-otp
 * 
 * Test endpoint to verify a 6-digit combined OTP before performing a critical action.
 * Body: { "otp": "482917" }
 */
router.post('/verify-otp', authenticate, checkFounder, (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ error: 'OTP is required' });
    }

    const result = verifyDualOTP(otp.toString());

    if (result.valid) {
        res.json({
            verified: true,
            message: 'Dual-Key OTP verified successfully. You may proceed with critical actions.'
        });
    } else {
        res.status(403).json({
            verified: false,
            error: result.error
        });
    }
});

/**
 * GET /founder/critical-actions
 * 
 * Returns the list of actions that require Dual-Key OTP.
 * The frontend uses this to know when to show the OTP popup.
 */
router.get('/critical-actions', authenticate, checkFounder, (req, res) => {
    res.json({
        actions: CRITICAL_ACTIONS,
        message: 'These actions require a 6-digit Dual-Founder OTP to execute.'
    });
});

/**
 * POST /founder/server-shutdown
 * 
 * Emergency server shutdown - requires Dual-Key OTP.
 * This is the "nuclear button" that stops the entire server.
 */
router.post('/server-shutdown', authenticate, checkFounder, requireDualOTP, (req, res) => {
    console.log(`[CRITICAL] Server shutdown initiated by ${req.user.username}`);
    res.json({
        success: true,
        message: 'Server shutdown command accepted. The server will stop in 10 seconds.'
    });

    // Graceful shutdown after 10 seconds
    setTimeout(() => {
        console.log('[CRITICAL] Server shutting down by Dual-Key Founder command...');
        process.exit(0);
    }, 10000);
});

/**
 * POST /founder/update-license
 * 
 * Update a college's license expiry date - requires Dual-Key OTP.
 * Body: { "founderOTP": "482917", "collegeId": "ace_engineering", "newExpiry": "2027-03-15" }
 */
router.post('/update-license', authenticate, checkFounder, requireDualOTP, (req, res) => {
    const { collegeId, newExpiry } = req.body;

    if (!collegeId || !newExpiry) {
        return res.status(400).json({ error: 'collegeId and newExpiry are required' });
    }

    // Store in environment or database
    console.log(`[LICENSE] License updated for ${collegeId} to ${newExpiry} by ${req.user.username}`);

    res.json({
        success: true,
        message: `License for ${collegeId} updated to expire on ${newExpiry}`
    });
});

module.exports = router;
