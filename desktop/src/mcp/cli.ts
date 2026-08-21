import { KevrynMcpServer } from './KevrynMcpServer';

// Parse API URL from env or use default local instance
const apiUrl = process.env.KEVRYN_API_URL || 'http://localhost:5000/api';

const server = new KevrynMcpServer(apiUrl);
server.startStdio().catch(console.error);
