import { WebSocket } from 'ws';
import { handleMessage } from './messageController';
import { disconnectPlayer } from '../services/playerService';

export function handleConnection(ws: WebSocket) {
  console.log('New client connected');
  
  // Set up message handler
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      handleMessage(ws, parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendErrorMessage(ws, 'Invalid message format');
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    disconnectPlayer(ws);
  });
}

export function sendMessage(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function sendErrorMessage(ws: WebSocket, errorText: string) {
  sendMessage(ws, {
    type: 'error',
    data: { error: true, errorText },
    id: 0
  });
}