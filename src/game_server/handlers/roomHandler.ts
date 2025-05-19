import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { generateId } from '../utils/idGenerator';
import { playerStore } from '../store';

const rooms: Record<string, {
  roomId: string;
  roomUsers: Array<{
    name: string;
    index: string | number;
  }>;
}> = {};

const games: Record<string, {
  id: string;
  players: string[];
  ships: Record<string, any>;
  state: string;
}> = {};

export function handleCreateRoom(ws: WebSocket, message: any) {
  const playerId = playerStore.socketToPlayerId.get(ws);
  if (!playerId) {
    sendMessage(ws, 'error', { errorText: 'You must register before creating a room' });
    return;
  }
  
  const roomId = generateId();
  const room = {
    roomId,
    roomUsers: [{
      name: playerStore.players[playerId].name,
      index: playerId
    }]
  };
  
  rooms[roomId] = room;
  
  console.log(`Room created with ID: "${roomId}"`);
  
  updateRoomsForAllPlayers();
}

export function handleAddUserToRoom(ws: WebSocket, message: any) {
  let data = message.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse data string:', e);
    }
  }
  
  const { indexRoom } = data;
  const playerId = playerStore.socketToPlayerId.get(ws);
  
  if (!playerId || !indexRoom || !rooms[indexRoom]) {
    sendMessage(ws, 'error', { errorText: 'Invalid room or player' });
    return;
  }
  
  rooms[indexRoom].roomUsers.push({
    name: playerStore.players[playerId].name,
    index: playerId
  });
  
  console.log(`Player ${playerId} joined room ${indexRoom}`);
  
  if (rooms[indexRoom].roomUsers.length === 2) {
    const gameId = generateId();
    
    const game = {
      id: gameId,
      players: rooms[indexRoom].roomUsers.map(user => String(user.index)),  // Explicitly convert to string
      ships: {} as Record<string, any>,
      state: 'waiting_for_ships'
    };
    
    games[gameId] = game;
    
    rooms[indexRoom].roomUsers.forEach(user => {
      const playerSocket = playerStore.players[user.index].socket;
      sendMessage(playerSocket, 'create_game', {
        idGame: gameId,
        idPlayer: user.index
      }, 0);
    });
    
    delete rooms[indexRoom];
    
    console.log(`Game created with ID: "${gameId}"`);
  }
  
  updateRoomsForAllPlayers();
}

function updateRoomsForAllPlayers() {
  const roomsArray = Object.values(rooms)
    .filter(room => room.roomUsers.length === 1)
    .map(room => ({
      roomId: room.roomId,
      roomUsers: room.roomUsers
    }));
  
  Object.values(playerStore.players).forEach(player => {
    if (player.socket.readyState === WebSocket.OPEN) {
      sendMessage(player.socket, 'update_room', roomsArray, 0);
    }
  });
  
  console.log(`Updated rooms: ${JSON.stringify(roomsArray)}`);
}