// src/game_server/handlers/shipHandler.ts
import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { getPlayerBySocket } from '../services/playerService';
import { getGame, addShipsToGame } from '../services/gameService';
import { validateShips } from '../utils/shipValidator';
export function handleAddShips(ws: WebSocket, message: any) {
  const player = getPlayerBySocket(ws);
  
  if (!player) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'You must register first' },
      id: 0
    });
    return;
  }
  
  const { gameId, ships, indexPlayer } = message.data;
  
  if (indexPlayer !== player.index) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid player index' },
      id: 0
    });
    return;
  }
  
  if (!gameId || !ships || !Array.isArray(ships)) {
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
  
  if (!validateShips(ships)) {
    sendMessage(ws, {
      type: 'error',
      data: { error: true, errorText: 'Invalid ship configuration' },
      id: 0
    });
    return;
  }
  
  addShipsToGame(gameId, indexPlayer, ships);
}