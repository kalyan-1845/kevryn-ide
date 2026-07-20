const io = require('socket.io-client');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('Connected to server!');
    socket.emit('terminal:create', { termId: 'server-1', userId: 'test_user_id' });
    
    setTimeout(() => {
        console.log('Sending command...');
        socket.emit('terminal:write', { termId: 'server-1', data: 'echo "Hello World"\r' });
    }, 1000);
});

socket.on('terminal:data', ({ termId, data }) => {
    console.log(`[DATA] ${data}`);
});
