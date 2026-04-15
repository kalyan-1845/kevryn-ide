const express = require('express');
const router = express.Router();
const neuralService = require('../services/ollamaService'); // This now uses HF
const gateway = require('../services/neuralGateway');
const { authenticate } = require('../utils/authMiddleware');

/**
 * Public Neural Gateway Endpoint 🛰️🔑
 * Accessible via Kevryn API Keys
 */
router.post('/gateway/chat', async (req, res) => {
    try {
        const { key, messages } = req.body;
        
        if (!key || !gateway.validateKey(key)) {
            return res.status(401).json({ error: "Invalid Kevryn API Key" });
        }

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        console.log(`[Gateway] Authorized request with key: ${key.substring(0, 10)}...`);
        const response = await neuralService.chat(messages, { tier: 'expert' });
        
        res.json({
            success: true,
            response: response.content,
            model: response.model,
            provider: 'Kevryn Neural Gateway'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Key Management Routes (Private - Auth required) 🔐
 */
router.get('/keys', authenticate, async (req, res) => {
    try {
        res.json({ keys: gateway.listKeys() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/keys/generate', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const newKey = gateway.generateKey(name);
        res.json({ success: true, key: newKey });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/keys/:key', authenticate, async (req, res) => {
    try {
        gateway.deleteKey(req.params.key);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
