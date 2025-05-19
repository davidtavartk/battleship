import WebSocket from 'ws';
import { Player } from '../types/game';

interface PlayerStore {
  players: Record<string | number, Player>;
  socketToPlayerId: Map<WebSocket, string | number>;
  
  getPlayerBySocket(socket: WebSocket): Player | undefined;
}

const playerStore: PlayerStore = {
  players: {},
  socketToPlayerId: new Map(),
  
  getPlayerBySocket(socket: WebSocket): Player | undefined {
    const playerId = this.socketToPlayerId.get(socket);
    if (playerId) {
      return this.players[playerId];
    }
    return undefined;
  }
};

export default playerStore;