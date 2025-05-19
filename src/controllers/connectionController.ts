import WebSocket from 'ws';
import { handleMessage } from './messageController';
import { removePlayerFromGame } from '../models/gameManager';

export function handleConnection(ws: WebSocket) {
  console.log('New client connected');
  
  // Set up message handler
  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      handleMessage(ws, parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendErrorMessage(ws, 'Invalid message format');
    }
  });
  
  
  ws.on('close', () => {
    console.log('Client disconnected');
    
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