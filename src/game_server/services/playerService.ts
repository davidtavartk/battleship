// src/game_server/services/playerService.ts
import { WebSocket } from 'ws';
import { playerStore } from '../store';
import { generateId } from '../utils/idGenerator';

export function createPlayer(name: string, password: string, socket: WebSocket) {
  // Check if player exists
  const existingPlayer = Object.values(playerStore.players).find(p => p.name === name);
  
  if (existingPlayer) {
    // Validate password
    if (existingPlayer.password !== password) {
      return null;
    }
    
    // Update socket connection
    existingPlayer.socket = socket;
    playerStore.socketToPlayerId.set(socket, existingPlayer.index);
    return existingPlayer;
  }
  
  // Create new player
  const playerId = generateId();
  const newPlayer = {
    name,
    index: playerId,
    password,
    wins: 0,
    socket
  };
  
  playerStore.players[playerId] = newPlayer;
  playerStore.socketToPlayerId.set(socket, playerId);
  
  return newPlayer;
}

export function getPlayerBySocket(socket: WebSocket) {
  const playerId = playerStore.socketToPlayerId.get(socket);
  if (!playerId) return undefined;
  
  return playerStore.players[playerId];
}

export function disconnectPlayer(socket: WebSocket) {
  const playerId = playerStore.socketToPlayerId.get(socket);
  if (playerId) {
    // Handle any cleanup needed when player disconnects
    playerStore.socketToPlayerId.delete(socket);
    // Note: we keep the player in players store for reconnection
  }
}

export function getWinners() {
  return Object.values(playerStore.players)
    .map(player => ({ name: player.name, wins: player.wins }))
    .sort((a, b) => b.wins - a.wins);
}