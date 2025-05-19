// src/controllers/messageController.ts
import WebSocket from "ws";
import { BaseMessage } from "../types/messages";
import {
  createPlayer,
  getPlayer,
  getWinners,
  getPlayerBySocket,
} from "../../models/playerManager";
import {
  createRoom,
  addPlayerToRoom,
  getAvailableRooms,
} from "../../models/roomManager";
import { sendMessage } from "./connectionController";
import { Player, Room } from "../types/game";

const wsToPlayerMap = new Map<WebSocket, string>();

const connections: WebSocket[] = [];

export function handleConnection(ws: WebSocket) {
  connections.push(ws);
  console.log(`New client connected. Total connections: ${connections.length}`);

  ws.on("close", () => {
    const index = connections.indexOf(ws);
    if (index !== -1) {
      connections.splice(index, 1);
    }

    // Handle player disconnection
    const player = getPlayerBySocket(ws);
    if (player) {
      console.log(`Player ${player.name} disconnected`);
    }

    console.log(
      `Client disconnected. Remaining connections: ${connections.length}`
    );
  });
}

export function handleMessage(ws: WebSocket, message: BaseMessage) {
  console.log("Received message:", message);

  switch (message.type) {
    case "reg":
      handleRegistration(ws, message);
      break;

    case "create_room":
      handleCreateRoom(ws, message);
      break;

    case "add_user_to_room":
      handleAddUserToRoom(ws, message);
      break;

    case "add_ships":
      // To be implemented
      break;

    case "attack":
      // To be implemented
      break;

    case "randomAttack":
      // To be implemented
      break;

    default:
      console.warn(`Unknown message type: ${message.type}`);
      sendMessage(ws, {
        type: "error",
        data: { error: true, errorText: "Unknown message type" },
        id: 0,
      });
  }
}

function handleRegistration(ws: WebSocket, message: BaseMessage) {
  const { name, password } = message.data;

  if (!name || !password) {
    sendMessage(ws, {
      type: "reg",
      data: {
        error: true,
        errorText: "Name and password are required",
      },
      id: 0,
    });
    return;
  }

  const player = createPlayer(name, password, ws);

  if (!player) {
    sendMessage(ws, {
      type: "reg",
      data: {
        error: true,
        errorText: "Invalid credentials",
      },
      id: 0,
    });
    return;
  }

  // Associate this WebSocket with the player
  wsToPlayerMap.set(ws, player.index as string);

  // Send successful registration response
  sendMessage(ws, {
    type: "reg",
    data: {
      name: player.name,
      index: player.index,
      error: false,
      errorText: "",
    },
    id: 0,
  });

  // Send winners list
  broadcastWinners();

  // Send available rooms
  broadcastUpdateRooms();
}

function handleCreateRoom(ws: WebSocket, message: BaseMessage) {
  const playerId = wsToPlayerMap.get(ws);

  if (!playerId) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "You must register first" },
      id: 0,
    });
    return;
  }

  const player = getPlayer(playerId);

  if (!player) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "Player not found" },
      id: 0,
    });
    return;
  }

  createRoom(playerId, player);
}

function handleAddUserToRoom(ws: WebSocket, message: BaseMessage) {
  const playerId = wsToPlayerMap.get(ws);

  if (!playerId) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "You must register first" },
      id: 0,
    });
    return;
  }

  const player = getPlayer(playerId);

  if (!player) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "Player not found" },
      id: 0,
    });
    return;
  }

  const { indexRoom } = message.data;

  if (!indexRoom) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "Room ID is required" },
      id: 0,
    });
    return;
  }

  const room = addPlayerToRoom(indexRoom, playerId, player);

  if (!room) {
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "Room not found or full" },
      id: 0,
    });
    return;
  }

  // Start game when the second player joins
  if (room.roomUsers.length === 2) {
    initializeGame(room);
  }
}

function initializeGame(room: Room) {
  // Create game state and assign player IDs
  // This will be implemented in the game manager
  // For now, just notify both players that they're in a game

  // Send create_game to both players
  room.roomUsers.forEach((user, index) => {
    const player = getPlayer(user.index);
    if (player) {
      sendMessage(player.socket, {
        type: "create_game",
        data: {
          idGame: room.roomId,
          idPlayer: index + 1, // Simple player ID assignment: 1 or 2
        },
        id: 0,
      });
    }
  });
}

export function broadcastUpdateRooms() {
  const availableRooms = getAvailableRooms();

  // Create message format
  const updateRoomMessage = {
    type: "update_room",
    data: availableRooms.map((room) => ({
      roomId: room.roomId,
      roomUsers: room.roomUsers,
    })),
    id: 0,
  };

  // Send to all connected players
  Object.values(getPlayer).forEach((player: Player) => {
    if (player && player.socket) {
      sendMessage(player.socket, updateRoomMessage);
    }
  });
}

export function broadcastWinners() {
  const winners = getWinners();

  const updateWinnersMessage = {
    type: "update_winners",
    data: winners,
    id: 0,
  };

  // Send to all connected players
  Object.values(getPlayer).forEach((player: Player) => {
    if (player && player.socket) {
      sendMessage(player.socket, updateWinnersMessage);
    }
  });
}
