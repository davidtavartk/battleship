import { GameState } from '../types/game';

interface GameStore {
  games: Record<string | number, GameState>;
}

const gameStore: GameStore = {
  games: {}
};

export default gameStore;