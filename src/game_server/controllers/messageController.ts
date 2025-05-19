import { WebSocket } from 'ws';
import { handleRegistration } from '../handlers/authHandler';
import { handleCreateRoom, handleAddUserToRoom } from '../handlers/roomHandler';
import { handleAddShips } from '../handlers/shipHandler';
import { handleAttack, handleRandomAttack } from '../handlers/gameHandler';

export function handleMessage(ws: WebSocket, message: any) {
  console.log('Received message:', message);
  
  // Parse data if it's a string
  if (message.data && typeof message.data === 'string' && message.data !== '') {
    try {
      message.data = JSON.parse(message.data);
    } catch (e) {
      console.error('Failed to parse message data:', e);
    }
  }
  
  switch (message.type) {
    case 'reg':
      handleRegistration(ws, message);
      break;
    case 'create_room':
      handleCreateRoom(ws, message);
      break;
    case 'add_user_to_room':
      handleAddUserToRoom(ws, message);
      break;
    case 'add_ships':
      handleAddShips(ws, message);
      break;
    case 'attack':
      handleAttack(ws, message);
      break;
    case 'randomAttack':
      handleRandomAttack(ws, message);
      break;
    default:
      console.log(`Unhandled message type: ${message.type}`);
      break;
  }
}