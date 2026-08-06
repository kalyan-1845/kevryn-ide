const crypto = require('crypto');

/**
 * Dual-Key Founder OTP System (Google Authenticator Compatible)
 * 
 * Uses standard TOTP (RFC 6238) so it works with Google Authenticator.
 * Each founder scans a QR code once on their phone.
 * Google Authenticator shows a 6-digit code every 30 seconds.
 * Each founder reads only the FIRST 3 digits to the other founder.
 * Combined 6-digit OTP = Founder1's first 3 + Founder2's first 3.
 */

// TOTP Configuration
const TOTP_PERIOD = 30;  // New code every 30 seconds (Google Authenticator standard)
const TOTP_DIGITS = 6;   // Google Authenticator standard

// Founder secrets (Base32-encoded, stored in .env)
// Generate these once during initial setup using the /founder/setup endpoint
const FOUNDER_1_SECRET = process.env.FOUNDER_1_SECRET || 'JBSWY3DPEHPK3PXP'; // Default dev-only secret
const FOUNDER_2_SECRET = process.env.FOUNDER_2_SECRET || 'KVKFKRCPNZQUYMLX'; // Default dev-only secret

/**
 * Base32 decoder (for Google Authenticator compatibility)
 */
function base32Decode(encoded) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
        const val = alphabet.indexOf(char);
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
}

/**
 * Generate a random Base32 secret (16 characters = 80 bits)
 * Call this ONCE during initial setup for each founder.
 */
function generateBase32Secret() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const randomBytes = crypto.randomBytes(10); // 80 bits
    for (let i = 0; i < 16; i++) {
        const index = randomBytes[i % 10] % 32;
        secret += alphabet[index];
    }
    return secret;
}

/**
 * Standard TOTP generation (RFC 6238)
 * This is the exact same algorithm Google Authenticator uses internally.
 */
function generateTOTP(base32Secret, timeOffset = 0) {
    const secretBytes = base32Decode(base32Secret);
    const timeCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD) + timeOffset;

    // Convert counter to 8-byte big-endian buffer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(timeCounter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(timeCounter & 0xFFFFFFFF, 4);

    // HMAC-SHA1 (Google Authenticator standard)
    const hmac = crypto.createHmac('sha1', secretBytes);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0F;
    const binary =
        ((hash[offset] & 0x7F) << 24) |
        ((hash[offset + 1] & 0xFF) << 16) |
        ((hash[offset + 2] & 0xFF) << 8) |
        (hash[offset + 3] & 0xFF);

    const fullCode = (binary % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
    return fullCode;
}

/**
 * Get the first 3 digits of a founder's current TOTP code.
 * This is what the founder reads out loud on the phone call.
 */
function getFounderCode(founderNumber) {
    const secret = founderNumber === 1 ? FOUNDER_1_SECRET : FOUNDER_2_SECRET;
    const fullCode = generateTOTP(secret);
    return fullCode.substring(0, 3); // First 3 digits only
}

/**
 * Verify a 6-digit Dual-Key OTP.
 * First 3 digits = Founder 1's first 3 digits from Google Authenticator
 * Last 3 digits = Founder 2's first 3 digits from Google Authenticator
 * 
 * Checks current time window AND previous window (grace period for slow typers)
 */
function verifyDualOTP(sixDigitOTP) {
    if (!sixDigitOTP || sixDigitOTP.length !== 6) {
        return { valid: false, error: 'OTP must be exactly 6 digits' };
    }

    const founder1Input = sixDigitOTP.substring(0, 3);
    const founder2Input = sixDigitOTP.substring(3, 6);

    // Check current and previous time windows (grace period)
    let founder1Valid = false;
    let founder2Valid = false;

    for (let offset = -1; offset <= 1; offset++) {
        const f1Code = generateTOTP(FOUNDER_1_SECRET, offset).substring(0, 3);
        const f2Code = generateTOTP(FOUNDER_2_SECRET, offset).substring(0, 3);

        if (founder1Input === f1Code) founder1Valid = true;
        if (founder2Input === f2Code) founder2Valid = true;
    }

    if (!founder1Valid && !founder2Valid) {
        return { valid: false, error: 'Both founder codes are incorrect' };
    }
    if (!founder1Valid) {
        return { valid: false, error: 'Founder 1 (first 3 digits) code is incorrect' };
    }
    if (!founder2Valid) {
        return { valid: false, error: 'Founder 2 (last 3 digits) code is incorrect' };
    }

    return { valid: true };
}

/**
 * Generate the otpauth:// URI for Google Authenticator QR code scanning.
 * Each founder scans their unique QR code ONCE during initial setup.
 * 
 * The URI can be turned into a QR code using any free QR code generator.
 */
function getAuthenticatorURI(founderNumber, founderName) {
    const secret = founderNumber === 1 ? FOUNDER_1_SECRET : FOUNDER_2_SECRET;
    const label = encodeURIComponent(`KevRyn IDE:${founderName}`);
    const issuer = encodeURIComponent('KevRyn IDE');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}&algorithm=SHA1`;
}

/**
 * Express Middleware: Requires Dual-Key OTP for critical actions.
 * 
 * Usage: router.post('/dangerous-action', authenticate, requireDualOTP, handler)
 * 
 * Send OTP in body as { founderOTP: "482351" } or header X-Founder-OTP: 482351
 */
function requireDualOTP(req, res, next) {
    const otp = req.body.founderOTP || req.headers['x-founder-otp'];

    if (!otp) {
        return res.status(403).json({
            error: 'DUAL_OTP_REQUIRED',
            message: 'This action requires a 6-digit Dual-Founder OTP. Both founders must open Google Authenticator and share their first 3 digits.',
            requiresOTP: true
        });
    }

    const result = verifyDualOTP(otp.toString());

    if (!result.valid) {
        console.warn(`[SECURITY] Failed Dual-OTP attempt | IP: ${req.ip} | User: ${req.user?.username || 'unknown'} | Error: ${result.error}`);
        return res.status(403).json({
            error: 'INVALID_DUAL_OTP',
            message: result.error,
            requiresOTP: true
        });
    }

    console.log(`[SECURITY] Dual-OTP VERIFIED | Action: ${req.method} ${req.path} | User: ${req.user?.username || 'unknown'}`);
    next();
}

const CRITICAL_ACTIONS = [
    'DELETE_USER',
    'SHUTDOWN_SERVER',
    'UPDATE_LICENSE',
    'WIPE_DATABASE',
    'CHANGE_ADMIN_ROLE',
    'PUSH_UPDATE',
    'EXPORT_ALL_DATA'
];

module.exports = {
    generateBase32Secret,
    generateTOTP,
    verifyDualOTP,
    getFounderCode,
    getAuthenticatorURI,
    requireDualOTP,
    CRITICAL_ACTIONS
};
