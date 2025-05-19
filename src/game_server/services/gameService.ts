import { WebSocket } from 'ws';
import { sendMessage } from '../controllers/connectionController';
import { playerStore } from '../store';

// Game storage
const games: Record<string, {
  id: string;
  players: string[];
  ships: Record<string, any[]>;
  state: string;
  currentPlayer?: string;
}> = {};

export function createGame(gameId: string, players: string[]) {
  games[gameId] = {
    id: gameId,
    players,
    ships: {},
    state: 'waiting_for_ships'
  };
  
  return games[gameId];
}

export function getGame(gameId: string) {
  return games[gameId];
}

export function addShipsToGame(gameId: string, playerId: string, ships: any[]) {
  const game = games[gameId];
  
  if (!game) {
    console.log(`Game not found with ID: ${gameId}`);
    return false;
  }
  
  // Store ships for this player
  game.ships[playerId] = ships;
  
  console.log(`Ships added for player ${playerId} in game ${gameId}`);
  
  // Check if both players have added ships
  const allPlayersHaveShips = game.players.every(player => 
    game.ships[player] && game.ships[player].length > 0
  );
  
  // If both players have added ships, start the game
  if (allPlayersHaveShips) {
    startGame(gameId);
    return true;
  }
  
  // Send start_game message to the current player
  const playerSocket = playerStore.players[playerId].socket;
  sendMessage(playerSocket, 'start_game', {
    ships: ships,
    currentPlayerIndex: playerId
  }, 0);
  
  return true;
}

function startGame(gameId: string) {
  const game = games[gameId];
  
  if (!game) {
    return false;
  }
  
  // Update game state
  game.state = 'in_progress';
  
  // Choose first player randomly
  const firstPlayerIndex = Math.floor(Math.random() * game.players.length);
  game.currentPlayer = game.players[firstPlayerIndex];
  
  console.log(`Game ${gameId} started. First player: ${game.currentPlayer}`);
  
  // Send turn message to both players
  game.players.forEach(playerId => {
    const playerSocket = playerStore.players[playerId].socket;
    sendMessage(playerSocket, 'turn', {
      currentPlayer: game.currentPlayer
    }, 0);
  });
  
  return true;
}

export function handleAttack(gameId: string, playerId: string, x: number, y: number) {
  const game = games[gameId];
  
  if (!game) {
    return false;
  }
  
  // Ensure it's the player's turn
  if (game.currentPlayer !== playerId) {
    return false;
  }
  
  // Get opponent's id
  const opponentId = game.players.find(p => p !== playerId);
  
  if (!opponentId) {
    return false;
  }
  
  // Get opponent's ships
  const opponentShips = game.ships[opponentId];
  
  // Check if the attack hits any of the opponent's ships
  const hitResult = checkHit(opponentShips, x, y);
  
  // Send attack message to both players
  game.players.forEach(pid => {
    const playerSocket = playerStore.players[pid].socket;
    sendMessage(playerSocket, 'attack', {
      position: { x, y },
      currentPlayer: playerId,
      status: hitResult.status
    }, 0);
  });
  
  // Update the game state if a ship was hit or killed
  if (hitResult.status === 'hit') {
    // The player gets to shoot again
  } else if (hitResult.status === 'killed') {
    // Check if all ships are killed
    const allShipsKilled = checkAllShipsKilled(opponentShips);
    
    if (allShipsKilled) {
      // Game over - current player wins
      game.players.forEach(pid => {
        const playerSocket = playerStore.players[pid].socket;
        sendMessage(playerSocket, 'finish', {
          winPlayer: playerId
        }, 0);
      });
      
      // Update win count for the player
      if (playerStore.players[playerId]) {
        playerStore.players[playerId].wins++;
      }
      
      // Send updated winners list to all players
      sendWinnersUpdate();
      
      // Set game state to finished
      game.state = 'finished';
    } else {
      // The player gets to shoot again
    }
  } else {
    // Miss - change to the other player's turn
    game.currentPlayer = opponentId;
    
    // Send turn message to both players
    game.players.forEach(pid => {
      const playerSocket = playerStore.players[pid].socket;
      sendMessage(playerSocket, 'turn', {
        currentPlayer: game.currentPlayer
      }, 0);
    });
  }
  
  return true;
}

function checkHit(ships: any[], x: number, y: number) {
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    const { position, direction, length } = ship;
    
    // Check if coordinates hit this ship
    let hit = false;
    
    if (direction) { // vertical
      if (x === position.x && y >= position.y && y < position.y + length) {
        hit = true;
      }
    } else { // horizontal
      if (y === position.y && x >= position.x && x < position.x + length) {
        hit = true;
      }
    }
    
    if (hit) {
      // Check if this kills the ship (implementation depends on how you track hits)
      return { status: 'hit', shipIndex: i };
    }
  }
  
  return { status: 'miss' };
}

function checkAllShipsKilled(ships: any[]) {
  // Implementation depends on how you track hits
  return false;
}

function sendWinnersUpdate() {
  const winners = Object.values(playerStore.players)
    .filter(player => player.wins > 0)
    .map(player => ({
      name: player.name,
      wins: player.wins
    }));
  
  Object.values(playerStore.players).forEach(player => {
    if (player.socket.readyState === WebSocket.OPEN) {
      sendMessage(player.socket, 'update_winners', winners, 0);
    }
  });
}