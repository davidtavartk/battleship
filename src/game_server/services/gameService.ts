import { WebSocket } from "ws";
import { sendMessage } from "../controllers/connectionController";
import { playerStore } from "../store";

const games: Record<
  string,
  {
    id: string;
    players: string[];
    ships: Record<string, any[]>;
    state: string;
    currentPlayer?: string;
    hits: Record<string, Array<{ x: number; y: number }>>;
  }
> = {};

export function createGame(gameId: string, players: string[]) {
  games[gameId] = {
    id: gameId,
    players,
    ships: {},
    state: "waiting_for_ships",
    hits: {},
  };

  players.forEach((playerId) => {
    games[gameId].hits[playerId] = [];
  });

  console.log(
    `Created game with ID: ${gameId} and players: ${players.join(", ")}`
  );

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

  game.ships[playerId] = ships;

  console.log(`Ships added for player ${playerId} in game ${gameId}`);

  const playerSocket = playerStore.players[playerId].socket;
  sendMessage(
    playerSocket,
    "start_game",
    {
      ships: ships,
      currentPlayerIndex: playerId,
    },
    0
  );

  const allPlayersHaveShips = game.players.every(
    (player) => game.ships[player] && game.ships[player].length > 0
  );

  if (allPlayersHaveShips) {
    startGame(gameId);
    return true;
  }

  return true;
}

function startGame(gameId: string) {
  const game = games[gameId];

  if (!game) {
    return false;
  }

  game.state = "in_progress";

  const firstPlayerIndex = Math.floor(Math.random() * game.players.length);
  game.currentPlayer = game.players[firstPlayerIndex];

  console.log(`Game ${gameId} started. First player: ${game.currentPlayer}`);

  game.players.forEach((playerId) => {
    const playerSocket = playerStore.players[playerId].socket;
    sendMessage(
      playerSocket,
      "turn",
      {
        currentPlayer: game.currentPlayer,
      },
      0
    );
  });

  return true;
}

export function processAttack(
  gameId: string,
  playerId: string,
  x: number,
  y: number
) {
  const game = games[gameId];

  if (!game) {
    console.log(`Game not found with ID: ${gameId}`);
    return false;
  }

  if (game.currentPlayer !== playerId) {
    console.log(`Not player ${playerId}'s turn in game ${gameId}`);
    return false;
  }

  const opponentId = game.players.find((p) => p !== playerId);

  if (!opponentId) {
    console.log(`Opponent not found for player ${playerId} in game ${gameId}`);
    return false;
  }

  const opponentShips = game.ships[opponentId];

  if (!opponentShips) {
    console.log(
      `Opponent ships not found for player ${opponentId} in game ${gameId}`
    );
    return false;
  }

  const hitResult = checkHit(opponentShips, x, y, game.hits[opponentId]);

  if (hitResult.status === "hit" || hitResult.status === "killed") {
    game.hits[opponentId].push({ x, y });
  }

  game.players.forEach((pid) => {
    const playerSocket = playerStore.players[pid].socket;
    sendMessage(
      playerSocket,
      "attack",
      {
        position: { x, y },
        currentPlayer: playerId,
        status: hitResult.status,
      },
      0
    );
  });

  if (hitResult.status === "hit" || hitResult.status === "killed") {
    if (hitResult.status === "killed") {
      const allShipsKilled = checkAllShipsKilled(
        opponentShips,
        game.hits[opponentId]
      );

      if (allShipsKilled) {
        game.players.forEach((pid) => {
          const playerSocket = playerStore.players[pid].socket;
          sendMessage(
            playerSocket,
            "finish",
            {
              winPlayer: playerId,
            },
            0
          );
        });

        if (playerStore.players[playerId]) {
          playerStore.players[playerId].wins++;
        }

        sendWinnersUpdate();

        game.state = "finished";
        return true;
      }
    }

    game.players.forEach((pid) => {
      const playerSocket = playerStore.players[pid].socket;
      sendMessage(
        playerSocket,
        "turn",
        {
          currentPlayer: game.currentPlayer,
        },
        0
      );
    });
  } else {
    game.currentPlayer = opponentId;

    game.players.forEach((pid) => {
      const playerSocket = playerStore.players[pid].socket;
      sendMessage(
        playerSocket,
        "turn",
        {
          currentPlayer: game.currentPlayer,
        },
        0
      );
    });
  }

  return true;
}

function checkHit(
  ships: any[],
  x: number,
  y: number,
  previousHits: Array<{ x: number; y: number }>
) {
  if (previousHits.some((hit) => hit.x === x && hit.y === y)) {
    return { status: "miss" };
  }

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    const { position, direction, length } = ship;

    let hit = false;

    if (direction) {
      if (x === position.x && y >= position.y && y < position.y + length) {
        hit = true;
      }
    } else {
      if (y === position.y && x >= position.x && x < position.x + length) {
        hit = true;
      }
    }

    if (hit) {
      let hitCount = 0;

      if (direction) {
        for (let j = 0; j < length; j++) {
          if (
            previousHits.some(
              (hit) => hit.x === position.x && hit.y === position.y + j
            )
          ) {
            hitCount++;
          }
        }
      } else {
        for (let j = 0; j < length; j++) {
          if (
            previousHits.some(
              (hit) => hit.x === position.x + j && hit.y === position.y
            )
          ) {
            hitCount++;
          }
        }
      }

      if (hitCount + 1 === length) {
        return { status: "killed", shipIndex: i };
      } else {
        return { status: "hit", shipIndex: i };
      }
    }
  }

  return { status: "miss" };
}

function checkAllShipsKilled(
  ships: any[],
  hits: Array<{ x: number; y: number }>
) {
  for (const ship of ships) {
    const { position, direction, length } = ship;
    let allHit = true;

    if (direction) {
      for (let j = 0; j < length; j++) {
        if (
          !hits.some((hit) => hit.x === position.x && hit.y === position.y + j)
        ) {
          allHit = false;
          break;
        }
      }
    } else {
      for (let j = 0; j < length; j++) {
        if (
          !hits.some((hit) => hit.x === position.x + j && hit.y === position.y)
        ) {
          allHit = false;
          break;
        }
      }
    }

    if (!allHit) {
      return false;
    }
  }

  return true;
}

function sendWinnersUpdate() {
  const winners = Object.values(playerStore.players)
    .filter((player) => player.wins > 0)
    .map((player) => ({
      name: player.name,
      wins: player.wins,
    }));

  Object.values(playerStore.players).forEach((player) => {
    if (player.socket.readyState === WebSocket.OPEN) {
      sendMessage(player.socket, "update_winners", winners, 0);
    }
  });
}
