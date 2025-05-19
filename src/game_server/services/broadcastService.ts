import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getWinners } from './playerService';
import { getAvailableRooms } from '../models/roomManager';
import { getAllConnections } from './collectionService';

export function broadcastWinners(ws: WebSocket) {
  const winners = getWinners();
  
  sendMessage(ws, {
    type: 'update_winners',
    data: winners,
    id: 0
  });
}

export function broadcastRooms(ws: WebSocket) {
  const rooms = getAvailableRooms();
  
  sendMessage(ws, {
    type: 'update_room',
    data: rooms.map(room => ({
      roomId: room.roomId,
      roomUsers: room.roomUsers
    })),
    id: 0
  });
}

// Broadcast to all clients
export function broadcastWinnersToAll() {
  const winners = getWinners();
  const connections = getAllConnections();
  
  const message = {
    type: 'update_winners',
    data: winners,
    id: 0
  };
  
  connections.forEach(ws => {
    sendMessage(ws, message);
  });
}

export function broadcastRoomsToAll() {
  const rooms = getAvailableRooms();
  const connections = getAllConnections();
  
  const message = {
    type: 'update_room',
    data: rooms.map(room => ({
      roomId: room.roomId,
      roomUsers: room.roomUsers
    })),
    id: 0
  };
  
  connections.forEach(ws => {
    sendMessage(ws, message);
  });
}