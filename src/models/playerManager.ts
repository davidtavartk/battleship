// src/models/playerManager.ts
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import { Player } from '../types/game';

// In-memory database for players
const players: Record<string, Player> = {};

export function createPlayer(name: string, password: string, socket: WebSocket): Player | null {
  // Check if player exists with this name
  const existingPlayer = Object.values(players).find(p => p.name === name);
  
  if (existingPlayer) {
    // If player exists, validate password
    if (existingPlayer.password !== password) {
      return null; // Wrong password
    }
    
    // Update socket for existing player
    // existingPlayer.socket = socket;
    return existingPlayer;
  }
  
  // Create new player
  const playerId = uuidv4();
  const newPlayer: Player = {
    name,
    index: playerId,
    password,
    wins: 0,
    // socket
  };
  
  players[playerId] = newPlayer;
  return newPlayer;
}

export function getPlayer(playerId: string | number): Player | undefined {
  return players[playerId as string];
}

export function updatePlayerWins(playerId: string | number): void {
  const player = players[playerId as string];
  if (player) {
    player.wins += 1;
  }
}

export function getWinners(): { name: string; wins: number }[] {
  return Object.values(players)
    .map(player => ({ name: player.name, wins: player.wins }))
    .sort((a, b) => b.wins - a.wins);
}