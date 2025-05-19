import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/connectionController';
import { SERVER_PORT } from './const/config';

// Initialize the WebSocket server
const wss = new WebSocketServer({ port: SERVER_PORT });

console.log(`WebSocket server is running on port ${SERVER_PORT}`);

// Handle new connections
wss.on('connection', handleConnection);

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});