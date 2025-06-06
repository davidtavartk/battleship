import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { getGame, addShipsToGame } from '../services/gameService';
import { validateShips } from '../utils/shipValidator';

export function handleAddShips(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, 'error', { error: true, errorText: 'You must register first' });
    return;
  }

  let data = message.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse data string:', e);
      sendMessage(ws, 'error', { error: true, errorText: 'Invalid data format' });
      return;
    }
  }
  
  const { gameId, ships, indexPlayer } = data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid player index' });
    return;
  }
  
  if (!gameId || !ships || !Array.isArray(ships)) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid game data' });
    return;
  }
  
  const game = getGame(gameId);
  
  if (!game) {
    sendMessage(ws, 'error', { error: true, errorText: 'Game not found' });
    return;
  }
  
  if (!validateShips(ships)) {
    sendMessage(ws, 'error', { error: true, errorText: 'Invalid ship configuration' });
    return;
  }
  
  addShipsToGame(gameId, indexPlayer, ships);
}