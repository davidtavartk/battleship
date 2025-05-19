import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { generateRandomAttack, getGame, processAttack } from '../services/gameService';

export function handleAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, 'error', { error: true, errorText: 'You must register first' });
    return;
  }
  
  const { gameId, x, y, indexPlayer } = message.data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid player index' });
    return;
  }
  
  if (!gameId || x === undefined || y === undefined) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid attack data' });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, 'error', { error: true, errorText: 'Game not found' });
    return;
  }
  
  if (game.currentPlayer !== indexPlayer) {
    sendMessage(ws, 'error', { error: true, errorText: 'Not your turn' });
    return;
  }
  
  processAttack(gameId, indexPlayer, x, y);
}

export function handleRandomAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, 'error', { error: true, errorText: 'You must register first' });
    return;
  }
  
  const { gameId, indexPlayer } = message.data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid player index' });
    return;
  }
  
  if (!gameId) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid game data' });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, 'error', { error: true, errorText: 'Game not found' });
    return;
  }
  
  if (game.currentPlayer !== indexPlayer) {
    sendMessage(ws, 'error', { error: true, errorText: 'Not your turn' });
    return;
  }
  
  const { x, y } = generateRandomAttack(gameId, indexPlayer);
  processAttack(gameId, indexPlayer, x, y);
}