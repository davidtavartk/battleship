import { Room, Ship, GameState, AttackStatus, Position } from '../types/game';
import { sendMessage } from '../controllers/connectionController';
import { getPlayer, updatePlayerWins } from '../services/playerService';
import { gameStore } from '../store';
import { generateId } from '../utils/idGenerator';
import { broadcastWinnersToAll } from '../services/broadcastService';

export function getGame(gameId: string | number): GameState | undefined {
  return gameStore.games[gameId];
}

export function initializeGame(room: Room) {
  const gameId = generateId();
  
  const gameState: GameState = {
    gameId,
    players: room.roomUsers.map(user => ({
      playerId: user.index,
      ships: [],
      shots: [],
      hits: []
    })),
    currentPlayer: null,
    gameStarted: false,
    gameFinished: false
  };
  
  gameStore.games[gameId] = gameState;
  
  room.roomUsers.forEach((user, index) => {
    const player = getPlayer(user.index);
    if (player) {
      sendMessage(player.socket, 'create_game', {
        idGame: gameId,
        idPlayer: user.index
      });
    }
  });
  
  return gameState;
}

export function addShipsToGame(gameId: string | number, playerId: string | number, ships: Ship[]) {
  const game = getGame(gameId);
  if (!game) return null;
  
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  if (playerIndex === -1) return null;
  
  game.players[playerIndex].ships = ships;
  
  const player = getPlayer(playerId);
  if (!player) return null;
  
  sendMessage(player.socket, 'start_game', {
    ships: ships,
    currentPlayerIndex: playerId
  });
  
  const allShipsAdded = game.players.every(p => p.ships.length > 0);
  
  if (allShipsAdded && !game.gameStarted) {
    game.gameStarted = true;
    
    const firstPlayerIndex = Math.floor(Math.random() * game.players.length);
    game.currentPlayer = game.players[firstPlayerIndex].playerId;
    
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, 'turn', {
          currentPlayer: game.currentPlayer
        });
      }
    });
  }
  
  return game;
}

export function processAttack(gameId: string | number, attackerId: string | number, x: number, y: number) {
  const game = getGame(gameId);
  if (!game) return null;
  
  if (game.currentPlayer !== attackerId) return null;
  
  const attackerIndex = game.players.findIndex(p => p.playerId === attackerId);
  const defenderIndex = (attackerIndex + 1) % game.players.length;
  
  const attacker = game.players[attackerIndex];
  const defender = game.players[defenderIndex];
  
  attacker.shots.push({ x, y });
  
  const hitShip = defender.ships.find(ship => isShipHit(ship, x, y));
  let status: AttackStatus = 'miss';
  
  if (hitShip) {
    attacker.hits.push({ x, y });
    
    const shipPositions = getShipPositions(hitShip);
    const allPositionsHit = shipPositions.every(pos => 
      attacker.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
    );
    
    if (allPositionsHit) {
      status = 'killed';
      
      const surroundingPositions = getSurroundingPositions(shipPositions);
      surroundingPositions.forEach(pos => {
        if (!attacker.shots.some(shot => shot.x === pos.x && shot.y === pos.y)) {
          attacker.shots.push(pos);
        }
      });
    } else {
      status = 'shot';
    }
  }
  
  game.players.forEach(p => {
    const player = getPlayer(p.playerId);
    if (player) {
      sendMessage(player.socket, 'attack', {
        position: { x, y },
        currentPlayer: attackerId,
        status
      });
    }
  });
  
  const allShipsKilled = defender.ships.every(ship => {
    const shipPositions = getShipPositions(ship);
    return shipPositions.every(pos => 
      attacker.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
    );
  });
  
  if (allShipsKilled) {
    game.gameFinished = true;
    game.winner = attackerId;
    
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, 'finish', {
          winPlayer: attackerId
        });
      }
    });
    
    updatePlayerWins(attackerId);
    broadcastWinnersToAll();
    
    return game;
  }
  
  if (status === 'miss') {
    game.currentPlayer = defender.playerId;
    
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, 'turn', {
          currentPlayer: game.currentPlayer
        });
      }
    });
  }
  
  return game;
}

export function generateRandomAttack(gameId: string | number, playerId: string | number): { x: number; y: number } {
  const game = getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const attackerIndex = game.players.findIndex(p => p.playerId === playerId);
  const defenderIndex = (attackerIndex + 1) % game.players.length;
  
  const attacker = game.players[attackerIndex];
  
  // Generate random coordinates
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
    // Continue until we find coordinates that haven't been shot at
  } while (attacker.shots.some(shot => shot.x === x && shot.y === y));
  
  return { x, y };
}

// Helper functions
function isShipHit(ship: Ship, x: number, y: number): boolean {
  const positions = getShipPositions(ship);
  return positions.some(pos => pos.x === x && pos.y === y);
}

function getShipPositions(ship: Ship): Position[] {
  const positions: Position[] = [];
  const { position, direction, length } = ship;
  
  for (let i = 0; i < length; i++) {
    if (direction) { // horizontal
      positions.push({ x: position.x + i, y: position.y });
    } else { // vertical
      positions.push({ x: position.x, y: position.y + i });
    }
  }
  
  return positions;
}

function getSurroundingPositions(positions: Position[]): Position[] {
  const surrounding: Position[] = [];
  const minX = Math.max(0, Math.min(...positions.map(p => p.x)) - 1);
  const maxX = Math.min(9, Math.max(...positions.map(p => p.x)) + 1);
  const minY = Math.max(0, Math.min(...positions.map(p => p.y)) - 1);
  const maxY = Math.min(9, Math.max(...positions.map(p => p.y)) + 1);
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Only add positions that aren't part of the ship
      if (!positions.some(p => p.x === x && p.y === y)) {
        surrounding.push({ x, y });
      }
    }
  }
  
  return surrounding;
}