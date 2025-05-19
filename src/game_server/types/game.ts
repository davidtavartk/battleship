
import { WebSocket } from 'ws';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type ShipDirection = boolean;
export type AttackStatus = 'miss' | 'killed' | 'shot';

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: ShipDirection;
  length: number;
  type: ShipType;
}

export interface Player {
  name: string;
  index: string | number;
  password: string;
  wins: number;
  socket: WebSocket;
}

export interface Room {
  roomId: string | number;
  roomUsers: {
    name: string;
    index: string | number;
  }[];
  gameState?: GameState;
}

export interface GameState {
  gameId: string | number;
  players: {
    playerId: string | number;
    ships: Ship[];
    shots: Position[];
    hits: Position[];
  }[];
  currentPlayer: string | number | null;
  gameStarted: boolean;
  gameFinished: boolean;
  winner?: string | number;
}