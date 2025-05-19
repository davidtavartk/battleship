import { WebSocket } from "ws";
import { sendMessage } from "../controllers/connectionController";
import { createPlayer } from "../services/playerService";
import { broadcastWinners, broadcastRooms } from "../services/broadcastService";

export function handleRegistration(ws: WebSocket, message: any) {
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

  broadcastWinners(ws);
  broadcastRooms(ws);
}
