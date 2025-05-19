import { WebSocket } from 'ws';
import { handleRegistration } from '../handlers/authHandler';
import { handleCreateRoom, handleAddUserToRoom } from '../handlers/roomHandler';

export function handleMessage(ws: WebSocket, message: any) {
  console.log('Received message:', message);
  
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
    default:
      console.log(`Unhandled message type: ${message.type}`);
      break;
  }
}