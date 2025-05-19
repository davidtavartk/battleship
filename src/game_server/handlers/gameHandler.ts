import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { getGame, processAttack } from '../services/gameService';

export function handleAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, 'error', { error: true, errorText: 'Player not found' });
    return;
  }
  
  // Ensure data is an object
  let data = message.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse attack data:', e);
      sendMessage(ws, 'error', { error: true, errorText: 'Invalid attack data format' });
      return;
    }
  }
  
  const { x, y, gameId, indexPlayer } = data;
  
  if (typeof x !== 'number' || typeof y !== 'number' || !gameId || indexPlayer !== player.index) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid attack parameters' });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, 'error', { error: true, errorText: 'Game not found' });
    return;
  }
  
  // Process the attack
  processAttack(gameId, indexPlayer, x, y);
}

export function handleRandomAttack(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, 'error', { error: true, errorText: 'Player not found' });
    return;
  }
  
  // Ensure data is an object
  let data = message.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse random attack data:', e);
      sendMessage(ws, 'error', { error: true, errorText: 'Invalid random attack data format' });
      return;
    }
  }
  
  const { gameId, indexPlayer } = data;
  
  if (!gameId || indexPlayer !== player.index) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid random attack parameters' });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, 'error', { error: true, errorText: 'Game not found' });
    return;
  }
  
  // Generate random attack coordinates
  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);
  
  // Process the attack
  processAttack(gameId, indexPlayer, x, y);
}