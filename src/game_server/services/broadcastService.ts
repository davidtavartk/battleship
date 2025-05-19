// src/game_server/services/broadcastService.ts
import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getWinners } from './playerService';
import { getAvailableRooms } from '../models/roomManager';
import { getAllConnections } from './connectionService';

// Broadcast to a single client
export function broadcastWinners(ws: WebSocket) {
  const winners = getWinners();
  sendMessage(ws, 'update_winners', winners);
}

export function broadcastRooms(ws: WebSocket) {
  const rooms = getAvailableRooms();
  const roomData = rooms.map(room => ({
    roomId: room.roomId,
    roomUsers: room.roomUsers
  }));
  
  sendMessage(ws, 'update_room', roomData);
}

// Broadcast to all clients
export function broadcastWinnersToAll() {
  const winners = getWinners();
  const connections = getAllConnections();
  
  connections.forEach(ws => {
    sendMessage(ws, 'update_winners', winners);
  });
}

export function broadcastRoomsToAll() {
  const rooms = getAvailableRooms();
  const roomData = rooms.map(room => ({
    roomId: room.roomId,
    roomUsers: room.roomUsers
  }));
  
  const connections = getAllConnections();
  
  connections.forEach(ws => {
    sendMessage(ws, 'update_room', roomData);
  });
}