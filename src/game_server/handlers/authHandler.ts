import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { playerStore } from '../store';
import { generateId } from '../utils/idGenerator';

export function handleRegistration(ws: WebSocket, message: any) {
  console.log('Registration message received:', message);

  let data = message.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse data string:', e);
    }
  }
  
  const { name, password } = data;
  
  if (!name || !password) {
    console.log('Missing name or password');
    sendMessage(ws, 'reg', {
      error: true,
      errorText: 'Name and password are required'
    });
    return;
  }
  
  console.log(`Registering user: ${name} with password: ${password}`);
  
  // Create player
  const playerId = generateId();
  const player = {
    name,
    index: playerId,
    password,
    wins: 0,
    socket: ws
  };
  
  // Store the player
  playerStore.players[playerId] = player;
  playerStore.socketToPlayerId.set(ws, playerId);
  
  console.log(`Player created with ID: ${playerId}`);
  
  // Send successful registration response
  sendMessage(ws, 'reg', {
    name: player.name,
    index: player.index,
    error: false,
    errorText: ''
  });
  
  console.log('Registration response sent');
  
  // Send winners list (empty for now)
  sendMessage(ws, 'update_winners', []);
  
  console.log('Winners list sent');
  
  // Send available rooms (empty for now)
  sendMessage(ws, 'update_room', []);
  
  console.log('Room list sent');
}