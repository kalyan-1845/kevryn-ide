/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              KEVRYN GREEN AI - Security Monitor             ║
 * ║                                                              ║
 * ║  An intelligent security agent that runs inside the server   ║
 * ║  and watches for attacks, blocks bad actors, monitors health ║
 * ║  and sends real-time alerts to the team.                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    // How many failed logins before auto-blocking an IP
    MAX_LOGIN_FAILURES: 10,
    // How long an IP stays blocked (30 minutes)
    BLOCK_DURATION_MS: 30 * 60 * 1000,
    // How many requests per minute before flagging as suspicious
    REQUEST_FLOOD_THRESHOLD: 200,
    // Health check interval (30 seconds)
    HEALTH_CHECK_INTERVAL_MS: 30 * 1000,
    // Memory usage warning threshold (85%)
    MEMORY_WARNING_PERCENT: 85,
    // Log file path
    LOG_FILE: path.join(__dirname, '..', 'logs', 'greenai.log'),
    // Alert webhook (Discord or Telegram - set in .env)
    ALERT_WEBHOOK: process.env.GREENAI_WEBHOOK_URL || null,
    // Scanner paths that indicate automated attack tools
    SCANNER_PATHS: [
        '/.env', '/wp-admin', '/wp-login', '/phpmyadmin', '/phpinfo',
        '/.git/', '/config.php', '/admin.php', '/shell.php', '/cmd.php',
        '/backup.sql', '/database.sql', '/dump.sql', '/.htaccess',
        '/xmlrpc.php', '/wp-content', '/wp-includes', '/administrator',
        '/cgi-bin', '/.svn', '/.DS_Store', '/web.config'
    ]
};

// ============================================================
// IN-MEMORY STATE
// ============================================================

// Blocked IPs: { ip: { blockedAt: Date, reason: string, expiresAt: Date } }
const blockedIPs = {};

// Failed login tracker: { ip: { count: number, lastAttempt: Date } }
const failedLogins = {};

// Request rate tracker: { ip: { count: number, windowStart: Date } }
const requestRates = {};

// Attack log (last 1000 events)
const attackLog = [];
const MAX_ATTACK_LOG = 1000;

// Server health history (last 100 readings)
const healthHistory = [];
const MAX_HEALTH_HISTORY = 100;

// Stats
const stats = {
    totalBlocked: 0,
    totalScannerDetections: 0,
    totalBruteForceBlocks: 0,
    totalFloodDetections: 0,
    startTime: new Date(),
    lastAlertSent: null
};

// ============================================================
// LOGGING
// ============================================================

const ensureLogDir = () => {
    const logDir = path.dirname(CONFIG.LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
};

const logEvent = (level, category, message, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,     // INFO, WARN, ALERT, BLOCK
        category,  // SCANNER, BRUTE_FORCE, FLOOD, HEALTH, SYSTEM
        message,
        ...details
    };

    // Console output with color coding
    const colors = { INFO: '\x1b[36m', WARN: '\x1b[33m', ALERT: '\x1b[31m', BLOCK: '\x1b[41m\x1b[37m' };
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    console.log(`${color}[GREEN AI][${level}] ${message}${reset}`);

    // File logging
    try {
        ensureLogDir();
        fs.appendFileSync(CONFIG.LOG_FILE, JSON.stringify(entry) + '\n');
    } catch (e) {
        // Silent fail - don't crash server over logging
    }

    // Keep in-memory attack log
    if (level !== 'INFO') {
        attackLog.push(entry);
        if (attackLog.length > MAX_ATTACK_LOG) attackLog.shift();
    }

    // Send webhook alert for critical events
    if (level === 'ALERT' || level === 'BLOCK') {
        sendAlert(entry);
    }
};

// ============================================================
// WEBHOOK ALERTS (Discord / Telegram / Slack)
// ============================================================

const sendAlert = async (event) => {
    if (!CONFIG.ALERT_WEBHOOK) return;

    // Rate limit alerts: max 1 per 30 seconds
    const now = Date.now();
    if (stats.lastAlertSent && (now - stats.lastAlertSent) < 30000) return;
    stats.lastAlertSent = now;

    try {
        const axios = require('axios');
        const payload = {
            content: `🛡️ **KEVRYN GREEN AI ALERT**\n` +
                     `**Level:** ${event.level}\n` +
                     `**Category:** ${event.category}\n` +
                     `**Message:** ${event.message}\n` +
                     `**IP:** ${event.ip || 'N/A'}\n` +
                     `**Time:** ${event.timestamp}`
        };
        await axios.post(CONFIG.ALERT_WEBHOOK, payload, { timeout: 5000 });
    } catch (e) {
        // Silent fail - don't crash server over webhook failure
    }
};

// ============================================================
// IP BLOCKING ENGINE
// ============================================================

const blockIP = (ip, reason, durationMs = CONFIG.BLOCK_DURATION_MS) => {
    blockedIPs[ip] = {
        blockedAt: new Date(),
        reason,
        expiresAt: new Date(Date.now() + durationMs)
    };
    stats.totalBlocked++;
    logEvent('BLOCK', 'FIREWALL', `IP BLOCKED: ${ip} — ${reason}`, { ip, reason, duration: `${durationMs / 60000} minutes` });
};

const isIPBlocked = (ip) => {
    const block = blockedIPs[ip];
    if (!block) return false;

    // Check if block has expired
    if (new Date() > block.expiresAt) {
        delete blockedIPs[ip];
        logEvent('INFO', 'FIREWALL', `IP unblocked (expired): ${ip}`, { ip });
        return false;
    }
    return true;
};

// ============================================================
// MIDDLEWARE: The Green AI Firewall
// ============================================================

/**
 * Main Green AI middleware - runs on EVERY request before anything else.
 * Checks if IP is blocked, detects scanners, tracks request rates.
 */
const greenAIFirewall = (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // 1. CHECK IF IP IS BLOCKED
    if (isIPBlocked(ip)) {
        stats.totalBlocked++;
        return res.status(403).json({
            error: 'Access denied',
            message: 'Your IP has been temporarily blocked due to suspicious activity.'
        });
    }

    // 2. DETECT AUTOMATED SCANNERS
    const urlLower = req.url.toLowerCase();
    const isScannerProbe = CONFIG.SCANNER_PATHS.some(p => urlLower.includes(p));
    if (isScannerProbe) {
        stats.totalScannerDetections++;
        logEvent('ALERT', 'SCANNER', `Scanner probe detected: ${req.method} ${req.url}`, {
            ip, userAgent: req.headers['user-agent'], url: req.url
        });

        // Auto-block after 3 scanner probes from the same IP
        if (!failedLogins[ip]) failedLogins[ip] = { count: 0, scannerHits: 0 };
        failedLogins[ip].scannerHits = (failedLogins[ip].scannerHits || 0) + 1;
        if (failedLogins[ip].scannerHits >= 3) {
            blockIP(ip, 'Automated vulnerability scanner detected');
        }

        return res.status(404).send('Not found');
    }

    // 3. REQUEST FLOOD DETECTION
    const now = Date.now();
    if (!requestRates[ip]) {
        requestRates[ip] = { count: 1, windowStart: now };
    } else {
        // Reset window every minute
        if (now - requestRates[ip].windowStart > 60000) {
            requestRates[ip] = { count: 1, windowStart: now };
        } else {
            requestRates[ip].count++;
            if (requestRates[ip].count > CONFIG.REQUEST_FLOOD_THRESHOLD) {
                stats.totalFloodDetections++;
                logEvent('ALERT', 'FLOOD', `Request flood from ${ip}: ${requestRates[ip].count} req/min`, { ip });
                blockIP(ip, `Request flood: ${requestRates[ip].count} requests in 1 minute`);
                return res.status(429).json({ error: 'Too many requests. You have been temporarily blocked.' });
            }
        }
    }

    next();
};

/**
 * Track failed login attempts. Call this from the auth route on login failure.
 */
const trackLoginFailure = (ip) => {
    if (!failedLogins[ip]) {
        failedLogins[ip] = { count: 0, lastAttempt: new Date(), scannerHits: 0 };
    }
    failedLogins[ip].count++;
    failedLogins[ip].lastAttempt = new Date();

    logEvent('WARN', 'BRUTE_FORCE', `Failed login attempt #${failedLogins[ip].count} from ${ip}`, { ip });

    if (failedLogins[ip].count >= CONFIG.MAX_LOGIN_FAILURES) {
        stats.totalBruteForceBlocks++;
        blockIP(ip, `Brute-force: ${failedLogins[ip].count} failed login attempts`);
        failedLogins[ip].count = 0; // Reset counter after blocking
    }
};

/**
 * Reset login failure counter on successful login.
 */
const trackLoginSuccess = (ip) => {
    if (failedLogins[ip]) {
        delete failedLogins[ip];
    }
};

// ============================================================
// HEALTH MONITORING (Background Worker)
// ============================================================

let healthCheckTimer = null;

const startHealthMonitor = (mongoose) => {
    logEvent('INFO', 'SYSTEM', '🟢 Green AI Health Monitor started');

    healthCheckTimer = setInterval(() => {
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        const health = {
            timestamp: new Date().toISOString(),
            server: 'online',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            memory: {
                systemUsedPercent: usedPercent,
                heapUsedMB,
                heapTotalMB
            },
            uptime: Math.round(process.uptime()),
            blockedIPs: Object.keys(blockedIPs).length,
            activeThreats: attackLog.filter(e => 
                new Date() - new Date(e.timestamp) < 300000 // Last 5 minutes
            ).length
        };

        healthHistory.push(health);
        if (healthHistory.length > MAX_HEALTH_HISTORY) healthHistory.shift();

        // ALERT: Database disconnected
        if (health.database !== 'connected') {
            logEvent('ALERT', 'HEALTH', '⚠️ Database connection lost!', { dbState: mongoose.connection.readyState });
        }

        // ALERT: High memory usage
        if (usedPercent > CONFIG.MEMORY_WARNING_PERCENT) {
            logEvent('ALERT', 'HEALTH', `⚠️ High memory usage: ${usedPercent}%`, { usedPercent, heapUsedMB });
        }

    }, CONFIG.HEALTH_CHECK_INTERVAL_MS);
};

// ============================================================
// CLEANUP (Garbage Collection for expired entries)
// ============================================================

const startCleanupWorker = () => {
    setInterval(() => {
        const now = Date.now();

        // Clean expired blocked IPs
        for (const ip of Object.keys(blockedIPs)) {
            if (new Date() > blockedIPs[ip].expiresAt) {
                delete blockedIPs[ip];
            }
        }

        // Clean stale request rate entries (older than 2 minutes)
        for (const ip of Object.keys(requestRates)) {
            if (now - requestRates[ip].windowStart > 120000) {
                delete requestRates[ip];
            }
        }

        // Clean stale failed login entries (older than 30 minutes)
        for (const ip of Object.keys(failedLogins)) {
            if (failedLogins[ip].lastAttempt && (now - failedLogins[ip].lastAttempt.getTime()) > 1800000) {
                delete failedLogins[ip];
            }
        }
    }, 60000); // Run cleanup every 60 seconds
};

// ============================================================
// ADMIN API ROUTES
// ============================================================

/**
 * Mount these routes on the Express app for the admin dashboard.
 * All routes require admin authentication.
 */
const mountAdminRoutes = (app, authenticate) => {
    // Green AI Dashboard - Get current security status
    app.get('/api/greenai/status', authenticate, (req, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        res.json({
            status: 'active',
            uptime: Math.round(process.uptime()),
            stats,
            blockedIPs: Object.entries(blockedIPs).map(([ip, data]) => ({
                ip,
                reason: data.reason,
                blockedAt: data.blockedAt,
                expiresAt: data.expiresAt
            })),
            recentThreats: attackLog.slice(-20).reverse(),
            health: healthHistory.slice(-10).reverse()
        });
    });

    // Manually block an IP
    app.post('/api/greenai/block', authenticate, (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { ip, reason, durationMinutes } = req.body;
        if (!ip) return res.status(400).json({ error: 'IP address required' });

        blockIP(ip, reason || 'Manually blocked by admin', (durationMinutes || 30) * 60 * 1000);
        res.json({ success: true, message: `IP ${ip} has been blocked` });
    });

    // Manually unblock an IP
    app.post('/api/greenai/unblock', authenticate, (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { ip } = req.body;
        if (!ip) return res.status(400).json({ error: 'IP address required' });

        if (blockedIPs[ip]) {
            delete blockedIPs[ip];
            logEvent('INFO', 'FIREWALL', `IP manually unblocked by admin: ${ip}`, { ip, admin: req.user.username });
            res.json({ success: true, message: `IP ${ip} has been unblocked` });
        } else {
            res.json({ success: false, message: `IP ${ip} is not currently blocked` });
        }
    });

    // Get full attack log
    app.get('/api/greenai/logs', authenticate, (req, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        res.json({
            total: attackLog.length,
            logs: attackLog.slice(-limit).reverse()
        });
    });

    logEvent('INFO', 'SYSTEM', '🟢 Green AI Admin API routes mounted');
};

// ============================================================
// INITIALIZATION
// ============================================================

const initialize = (app, mongoose, authenticate) => {
    logEvent('INFO', 'SYSTEM', '══════════════════════════════════════════');
    logEvent('INFO', 'SYSTEM', '🛡️  KEVRYN GREEN AI - Security Monitor');
    logEvent('INFO', 'SYSTEM', '   Watching. Protecting. Always On.');
    logEvent('INFO', 'SYSTEM', '══════════════════════════════════════════');

    // Apply firewall middleware (MUST be first middleware)
    app.use(greenAIFirewall);

    // Mount admin API routes
    mountAdminRoutes(app, authenticate);

    // Start background workers
    startHealthMonitor(mongoose);
    startCleanupWorker();

    logEvent('INFO', 'SYSTEM', `🟢 Green AI initialized | Config: Block after ${CONFIG.MAX_LOGIN_FAILURES} failed logins | Flood threshold: ${CONFIG.REQUEST_FLOOD_THRESHOLD} req/min`);
};

module.exports = {
    initialize,
    greenAIFirewall,
    trackLoginFailure,
    trackLoginSuccess,
    blockIP,
    isIPBlocked
};
