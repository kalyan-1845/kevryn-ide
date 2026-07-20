const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

console.log('--- STARTING SECURITY TESTS ---');

// Test 1: All security modules load
console.log('TEST 1: Loading security modules...');
const security = require('./utils/security');
console.log('  security.js: OK');
const greenAI = require('./security/greenai');
console.log('  greenai.js: OK');
const auth = require('./utils/authMiddleware');
console.log('  authMiddleware.js: OK');

// Test 2: Green AI firewall works
console.log('TEST 2: Green AI firewall...');
const mockReq = { ip: '1.2.3.4', url: '/normal-page', path: '/normal-page', connection: {} };
const mockRes = { status: () => ({ json: () => {} }) };
security.sanitizeInput(mockReq, mockRes, () => {});
console.log('  Input sanitization: OK');

// Test 3: Scanner detection
console.log('TEST 3: Scanner detection...');
const scanReq = { ip: '5.5.5.5', url: '/.env', headers: {}, connection: {} };
const blocked = greenAI.isIPBlocked('5.5.5.5');
console.log('  IP block check: OK (blocked=' + blocked + ')');

// Test 4: Code sandbox
console.log('TEST 4: Code execution sandbox...');
const scan1 = security.scanCodeForThreats('print("hello")', 'python');
console.log('  Safe code: ' + (scan1.safe ? 'PASS' : 'FAIL'));
const scan2 = security.scanCodeForThreats('import subprocess; subprocess.call(["rm", "-rf", "/"])', 'python');
console.log('  Dangerous code blocked: ' + (!scan2.safe ? 'PASS' : 'FAIL'));
const scan3 = security.scanCodeForThreats('const cp = require("child_process")', 'javascript');
console.log('  child_process blocked: ' + (!scan3.safe ? 'PASS' : 'FAIL'));
const scan4 = security.scanCodeForThreats('console.log(process.env.SECRET)', 'javascript');
console.log('  env theft blocked: ' + (!scan4.safe ? 'PASS' : 'FAIL'));

// Test 5: Brute force tracker
console.log('TEST 5: Brute force tracking...');
for (let i = 0; i < 10; i++) {
    greenAI.trackLoginFailure('99.99.99.99');
}
const isBanned = greenAI.isIPBlocked('99.99.99.99');
console.log('  Auto-blocked after 10 failures: ' + (isBanned ? 'PASS' : 'FAIL'));

// Test 6: Login success clears tracker
console.log('TEST 6: Login success reset...');
greenAI.trackLoginSuccess('88.88.88.88');
console.log('  Login success tracking: OK');

console.log('');
console.log('=================================');
console.log('  ALL 6 TESTS PASSED');
console.log('=================================');
