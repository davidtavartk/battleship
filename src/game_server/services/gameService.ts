
import { WebSocket } from 'ws';
import { Room, Ship, GameState, AttackStatus, Position } from '../types/game';
import { sendMessage } from '../controllers/connectionController';
import { getPlayer, updatePlayerWins } from '../services/playerService';
import { gameStore } from '../store';
import { generateId } from '../utils/idGenerator';
import { broadcastWinnersToAll } from '../services/broadcastService';

export function initializeGame(room: Room) {
  const gameId = generateId();
  
  const gameState: GameState = {
    gameId,
    players: room.roomUsers.map(user => ({
      playerId: user.index,
      ships: [] as Ship[],
      shots: [] as Position[],
      hits: [] as Position[]
    })),
    currentPlayer: null,
    gameStarted: false,
    gameFinished: false
  };
  
  gameStore.games[gameId] = gameState;

  room.roomUsers.forEach((user, index) => {
    const player = getPlayer(user.index);
    if (player) {
      sendMessage(player.socket, {
        type: 'create_game',
        data: {
          idGame: gameId,
          idPlayer: user.index
        },
        id: 0
      });
    }
  });
  
  return gameState;
}

export function getGame(gameId: string | number): GameState | undefined {
  return gameStore.games[gameId];
}

export function addShipsToGame(gameId: string | number, playerId: string | number, ships: Ship[]) {
  const game = getGame(gameId);
  if (!game) return null;
  
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  if (playerIndex === -1) return null;
  
  // Save player's ships
  game.players[playerIndex].ships = ships;
  
  // Get the player object
  const player = getPlayer(playerId);
  if (!player) return null;
  
  // Notify player about ships added
  sendMessage(player.socket, {
    type: 'start_game',
    data: {
      ships: ships,
      currentPlayerIndex: playerId
    },
    id: 0
  });
  
  // Check if both players have added ships
  const allShipsAdded = game.players.every(p => p.ships.length > 0);
  
  if (allShipsAdded && !game.gameStarted) {
    // Start the game
    game.gameStarted = true;
    
    // Randomly select first player
    const firstPlayerIndex = Math.floor(Math.random() * game.players.length);
    game.currentPlayer = game.players[firstPlayerIndex].playerId;
    
    // Notify all players about turn
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, {
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer
          },
          id: 0
        });
      }
    });
  }
  
  return game;
}

export function processAttack(gameId: string | number, attackerId: string | number, x: number, y: number) {
  const game = getGame(gameId);
  if (!game) return null;
  
  // Validate it's the attacker's turn
  if (game.currentPlayer !== attackerId) return null;
  
  // Find attacker and defender
  const attackerIndex = game.players.findIndex(p => p.playerId === attackerId);
  const defenderIndex = (attackerIndex + 1) % game.players.length;
  
  const attacker = game.players[attackerIndex];
  const defender = game.players[defenderIndex];
  
  // Add shot to attacker's shots
  attacker.shots.push({ x, y });
  
  // Check if the shot hits any of defender's ships
  const hitShip = defender.ships.find(ship => isShipHit(ship, x, y));
  let status: AttackStatus = 'miss';
  
  if (hitShip) {
    // Record hit
    attacker.hits.push({ x, y });
    
    // Check if ship is killed
    const shipPositions = getShipPositions(hitShip);
    const allPositionsHit = shipPositions.every(pos => 
      attacker.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
    );
    
    if (allPositionsHit) {
      status = 'killed';
      
      // Add misses around the ship
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
  
  // Broadcast attack result to all players
  game.players.forEach(p => {
    const player = getPlayer(p.playerId);
    if (player) {
      sendMessage(player.socket, {
        type: 'attack',
        data: {
          position: { x, y },
          currentPlayer: attackerId,
          status
        },
        id: 0
      });
    }
  });
  
  // Check if game is finished
  const allShipsKilled = defender.ships.every(ship => {
    const shipPositions = getShipPositions(ship);
    return shipPositions.every(pos => 
      attacker.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
    );
  });
  
  if (allShipsKilled) {
    // Game is finished
    game.gameFinished = true;
    game.winner = attackerId;
    
    // Broadcast game finish
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, {
          type: 'finish',
          data: {
            winPlayer: attackerId
          },
          id: 0
        });
      }
    });
    
    // Update winner's stats
    updatePlayerWins(attackerId);
    broadcastWinnersToAll();
    
    return game;
  }
  
  // Update turn if missed
  if (status === 'miss') {
    game.currentPlayer = defender.playerId;
    
    // Broadcast turn update
    game.players.forEach(p => {
      const player = getPlayer(p.playerId);
      if (player) {
        sendMessage(player.socket, {
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer
          },
          id: 0
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