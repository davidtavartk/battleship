// src/game_server/handlers/roomHandler.ts
import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { createRoom, addPlayerToRoom } from '../models/roomManager';
import { broadcastRoomsToAll } from '../services/broadcastService';
import { initializeGame } from '../services/gameService';

export function handleCreateRoom(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'You must register first' },
      id: 0
    });
    return;
  }
  
  const room = createRoom(player.index, player);
  broadcastRoomsToAll();
}

export function handleAddUserToRoom(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'You must register first' },
      id: 0
    });
    return;
  }
  
  const { indexRoom } = message.data;
  
  if (!indexRoom) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Room ID is required' },
      id: 0
    });
    return;
  }
  
  const room = addPlayerToRoom(indexRoom, player.index, player);
  
  if (!room) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Room not found or full' },
      id: 0
    });
    return;
  }
  
  broadcastRoomsToAll();
  
  if (room.roomUsers.length === 2) {
    initializeGame(room);
  }
}