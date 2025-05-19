import { WebSocket } from 'ws';
import { Player } from '../types/game';
import { playerStore } from '../store';
import { generateId } from '../utils/idGenerator';

export function createPlayer(name: string, password: string, socket: WebSocket): Player | null {
  const existingPlayer = Object.values(playerStore.players).find(p => p.name === name);
  
  if (existingPlayer) {
    if (existingPlayer.password !== password) {
      return null;
    }
    
    existingPlayer.socket = socket;
    playerStore.socketToPlayerId.set(socket, existingPlayer.index);
    return existingPlayer;
  }
  
  const playerId = generateId();
  const newPlayer: Player = {
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

export function getPlayer(playerId: string | number): Player | undefined {
  return playerStore.players[playerId];
}

export function getPlayerBySocket(socket: WebSocket): Player | undefined {
  const playerId = playerStore.socketToPlayerId.get(socket);
  if (playerId) {
    return playerStore.players[playerId];
  }
  return undefined;
}

export function updatePlayerWins(playerId: string | number): void {
  const player = playerStore.players[playerId];
  if (player) {
    player.wins += 1;
  }
}

export function getWinners(): { name: string; wins: number }[] {
  return Object.values(playerStore.players)
    .map(player => ({ name: player.name, wins: player.wins }))
    .sort((a, b) => b.wins - a.wins);
}

export function removePlayerSocket(socket: WebSocket): void {
  const playerId = playerStore.socketToPlayerId.get(socket);
  if (playerId) {
    playerStore.socketToPlayerId.delete(socket);
  }
}