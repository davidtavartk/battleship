// src/game_server/handlers/gameHandler.ts
import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { generateRandomAttack, getGame, processAttack } from '../services/gameService';

export function handleAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'You must register first' },
      id: 0
    });
    return;
  }
  
  const { gameId, x, y, indexPlayer } = message.data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid player index' },
      id: 0
    });
    return;
  }
  
  if (!gameId || x === undefined || y === undefined) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid attack data' },
      id: 0
    });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Game not found' },
      id: 0
    });
    return;
  }
  
  if (game.currentPlayer !== indexPlayer) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Not your turn' },
      id: 0
    });
    return;
  }
  
  processAttack(gameId, indexPlayer, x, y);
}

export function handleRandomAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'You must register first' },
      id: 0
    });
    return;
  }
  
  const { gameId, indexPlayer } = message.data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid player index' },
      id: 0
    });
    return;
  }
  
  if (!gameId) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid game data' },
      id: 0
    });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Game not found' },
      id: 0
    });
    return;
  }
  
  if (game.currentPlayer !== indexPlayer) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Not your turn' },
      id: 0
    });
    return;
  }
  
  const { x, y } = generateRandomAttack(gameId, indexPlayer);
  processAttack(gameId, indexPlayer, x, y);
}