import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/connectionController';
import { SERVER_PORT } from './consts/config';

console.log(`Starting WebSocket server on port ${SERVER_PORT}...`);

const wss = new WebSocketServer({ port: SERVER_PORT });

wss.on('listening', () => {
  console.log(`WebSocket server is running and listening on port ${SERVER_PORT}`);
});

wss.on('error', (error) => {
  console.error(`WebSocket server error:`, error);
});

wss.on('connection', (ws) => {
  console.log('New client connected');
  handleConnection(ws);
});

process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});