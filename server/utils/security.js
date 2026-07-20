/**
 * Kevryn IDE - Security Middleware Suite
 * 
 * Centralized security layer providing:
 * - Input sanitization (XSS, NoSQL injection prevention)
 * - Code execution sandboxing (dangerous pattern detection)
 * - Request payload validation
 * - Security headers enforcement
 * - Brute-force login protection
 * - Suspicious activity logging
 */

const rateLimit = require('express-rate-limit');

// ============================================================
// 1. INPUT SANITIZATION - Prevent XSS & NoSQL Injection
// ============================================================

/**
 * Strips dangerous HTML/script tags from string values recursively.
 * Prevents stored XSS attacks via chat messages, file names, etc.
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')  // Remove inline event handlers (onclick, onerror, etc.)
            .replace(/javascript\s*:/gi, '')                // Remove javascript: protocol
            .replace(/data\s*:\s*text\/html/gi, '')         // Remove data:text/html
            .trim();
    }
    return value;
};

/**
 * Deep-sanitizes all string values in req.body, req.query, and req.params.
 * Also strips MongoDB operator keys ($gt, $ne, etc.) to prevent NoSQL injection.
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const cleaned = Array.isArray(obj) ? [] : {};
        for (const key of Object.keys(obj)) {
            // Block MongoDB operators in keys (NoSQL injection prevention)
            if (key.startsWith('$')) {
                continue; // Skip dangerous keys entirely
            }
            
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleaned[key] = sanitizeObject(obj[key]);
            } else {
                cleaned[key] = sanitizeValue(obj[key]);
            }
        }
        return cleaned;
    };

    // Don't sanitize code execution body (students need to write any code)
    if (req.path === '/run-code' || req.path.startsWith('/api/ai')) {
        return next();
    }

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    
    next();
};

// ============================================================
// 2. CODE EXECUTION SANDBOX - Detect Dangerous Patterns
// ============================================================

/**
 * List of dangerous system commands/patterns that students should never execute.
 * These could allow a malicious user to take over the server OS.
 */
const DANGEROUS_PATTERNS = [
    // File system destruction
    /rm\s+-rf\s+\//i,
    /rmdir\s+\/s/i,
    /del\s+\/f\s+\/s/i,
    /format\s+[a-z]:/i,
    
    // Process/system manipulation
    /process\.exit/i,
    /child_process/i,
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /require\s*\(\s*['"]fs['"]\s*\)/i,
    /require\s*\(\s*['"]os['"]\s*\)/i,
    /require\s*\(\s*['"]net['"]\s*\)/i,
    /require\s*\(\s*['"]http['"]\s*\)/i,
    /require\s*\(\s*['"]https['"]\s*\)/i,
    
    // Python dangerous imports
    /import\s+subprocess/i,
    /import\s+shutil/i,
    /from\s+os\s+import/i,
    /__import__/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    
    // Network access attempts
    /curl\s+/i,
    /wget\s+/i,
    /nc\s+-/i,
    /ncat\s+/i,
    
    // Environment variable theft
    /process\.env/i,
    /os\.environ/i,
    /printenv/i,
    /env\s*$/im,

    // Reverse shell patterns
    /\/bin\/sh/i,
    /\/bin\/bash/i,
    /bash\s+-i/i,
];

/**
 * Scans submitted code for dangerous patterns before execution.
 * Returns { safe: boolean, reason: string }
 */
const scanCodeForThreats = (code, language) => {
    if (!code || typeof code !== 'string') {
        return { safe: false, reason: 'Empty or invalid code submission' };
    }

    // Size limit: prevent memory exhaustion attacks (max 500KB of code)
    if (code.length > 500 * 1024) {
        return { safe: false, reason: 'Code exceeds maximum allowed size (500KB)' };
    }

    // Skip scanning for safe languages that run in restricted environments
    // Python and JS have legitimate uses for some patterns, so we only block the worst
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            return {
                safe: false,
                reason: `Blocked: Code contains a restricted system-level pattern. Student code should not access the operating system, file system, or network directly.`
            };
        }
    }

    return { safe: true, reason: null };
};

/**
 * Express middleware that scans code before the /run-code endpoint processes it.
 */
const codeExecutionGuard = (req, res, next) => {
    if (req.path !== '/run-code' && !req.path.startsWith('/api/assignments/submit')) {
        return next();
    }

    const { code, language } = req.body || {};
    if (!code) return next(); // Let the endpoint handle missing code error

    const scan = scanCodeForThreats(code, language);
    if (!scan.safe) {
        console.warn(`[SECURITY] Code blocked from ${req.user?.userId || 'unknown'}: ${scan.reason}`);
        return res.status(403).json({
            error: 'Security Alert: Your code was blocked for safety reasons.',
            detail: scan.reason
        });
    }

    next();
};

// ============================================================
// 3. BRUTE-FORCE PROTECTION - Stricter rate limits for auth
// ============================================================

/**
 * Very strict rate limiter specifically for login/register endpoints.
 * 10 attempts per 15 minutes per IP address.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // 10 login attempts
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * Global API rate limiter - prevents any single IP from overwhelming the server.
 * 500 requests per minute is generous for normal use but stops automated attacks.
 */
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 500,                   // 500 requests per minute
    message: { error: 'Rate limit exceeded. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Don't rate-limit health checks
        return req.path === '/health' || req.path === '/ready';
    }
});

/**
 * Code execution limiter - students can only run code 30 times per minute.
 */
const executionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many code executions. Please wait a moment before running again.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================================
// 4. SUSPICIOUS ACTIVITY LOGGER
// ============================================================

/**
 * Logs potentially malicious requests for forensic analysis.
 */
const suspiciousActivityLogger = (req, res, next) => {
    const suspicious = [
        // Path traversal attempts
        req.url.includes('..'),
        req.url.includes('%2e%2e'),
        // SQL injection probes
        req.url.includes("'") && req.url.includes('OR'),
        req.url.includes('UNION') && req.url.includes('SELECT'),
        // Admin access attempts
        req.url.includes('/admin') && !req.headers.authorization,
        // Common scanner paths
        req.url.includes('.env'),
        req.url.includes('wp-admin'),
        req.url.includes('phpinfo'),
        req.url.includes('.git/'),
    ];

    if (suspicious.some(Boolean)) {
        console.warn(`[SECURITY ALERT] Suspicious request detected:`);
        console.warn(`  IP: ${req.ip}`);
        console.warn(`  Method: ${req.method}`);
        console.warn(`  URL: ${req.url}`);
        console.warn(`  User-Agent: ${req.headers['user-agent']}`);
        console.warn(`  Time: ${new Date().toISOString()}`);
    }

    next();
};

// ============================================================
// 5. SECURITY HEADERS - Harden HTTP responses
// ============================================================

/**
 * Adds additional security headers beyond what Helmet provides.
 */
const extraSecurityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Enable XSS filter in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent referrer leaking
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Prevent browser features abuse
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
};

module.exports = {
    sanitizeInput,
    scanCodeForThreats,
    codeExecutionGuard,
    loginLimiter,
    globalLimiter,
    executionLimiter,
    suspiciousActivityLogger,
    extraSecurityHeaders
};
