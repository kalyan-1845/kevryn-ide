const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access denied" });
    if (token.startsWith('Bearer ')) token = token.slice(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev_only_secret_DO_NOT_USE_IN_PRODUCTION';
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

const authenticate = verifyToken;

module.exports = { authenticate, verifyToken };
