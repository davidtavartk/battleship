// src/server.ts
import { WebSocketServer } from 'ws';
import { handleMessage } from './controllers/messageController';

const SERVER_PORT = 3000;

console.log(`Starting WebSocket server on port ${SERVER_PORT}...`);

// Initialize the WebSocket server
const wss = new WebSocketServer({ port: SERVER_PORT });

wss.on('listening', () => {
  console.log(`WebSocket server is running and listening on port ${SERVER_PORT}`);
});

wss.on('error', (error) => {
  console.error(`WebSocket server error:`, error);
});

// Handle new connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Set up message handler
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log('Received message:', parsedMessage);
      handleMessage(ws, parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: true, errorText: 'Invalid message format' },
        id: 0
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

console.log('WebSocket server initialized and waiting for connections');