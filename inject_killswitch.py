import re

with open('server/index.js', 'r', encoding='utf8') as f:
    c = f.read()

kill_switch_state = """
// ============================================================
// ENTERPRISE KILL-SWITCH (DUAL-KEY)
// ============================================================
let IS_LICENSE_EXPIRED = false;

app.post('/api/admin/kill-switch', (req, res) => {
    const { kalyanKey, raviKey, action } = req.body;
    
    // Dual-Key Verification
    const KALYAN_MASTER_KEY = process.env.KALYAN_KILL_KEY || 'KALYAN_OTP_2026';
    const RAVI_MASTER_KEY = process.env.RAVI_KILL_KEY || 'RAVI_OTP_2026';

    if (kalyanKey !== KALYAN_MASTER_KEY || raviKey !== RAVI_MASTER_KEY) {
        return res.status(403).json({ error: 'UNAUTHORIZED', message: 'Dual-Key Verification Failed. Both Founders must authorize.' });
    }

    if (action === 'LOCK') {
        IS_LICENSE_EXPIRED = true;
        // Optionally emit to all connected clients to force reload
        if (io) {
            io.emit('global-broadcast', {
                title: 'SYSTEM LOCKED',
                message: 'Enterprise License Expired. System is going offline.',
                priority: 'urgent',
                collegeName: 'SYSTEM ADMIN'
            });
        }
        return res.status(200).json({ message: 'SYSTEM HARD-LOCKED. LICENSE EXPIRED.' });
    } else if (action === 'UNLOCK') {
        IS_LICENSE_EXPIRED = false;
        return res.status(200).json({ message: 'SYSTEM UNLOCKED. LICENSE RESTORED.' });
    }

    res.status(400).json({ error: 'INVALID_ACTION' });
});

// GLOBAL KILL-SWITCH MIDDLEWARE
app.use((req, res, next) => {
    // Allow the unlock endpoint to always pass
    if (req.path === '/api/admin/kill-switch') {
        return next();
    }
    
    if (IS_LICENSE_EXPIRED) {
        return res.status(403).json({
            error: 'LICENSE_EXPIRED',
            message: 'Enterprise License Expired. Contact Founders (Bhoompally Kalyan Reddy & Javvadi Ravi Raj).'
        });
    }
    next();
});
"""

# Insert before cors
if 'ENTERPRISE KILL-SWITCH' not in c:
    c = c.replace("const cors = require('cors');", kill_switch_state + "\nconst cors = require('cors');")
    
    with open('server/index.js', 'w', encoding='utf8') as f:
        f.write(c)
    print("Kill-switch injected successfully.")
else:
    print("Kill-switch already exists.")
