import { WebSocket } from "ws";
import { sendMessage } from "./connectionController";
import { handleRegistration } from "../handlers/authHandler";
import { handleAddUserToRoom, handleCreateRoom } from "../handlers/roomHandler";
import { handleAddShips } from "../handlers/shipHandler";
import { handleAttack, handleRandomAttack } from "../handlers/gameHandler";

export function handleMessage(ws: WebSocket, message: any) {
  console.log("Received message:", message);

  try {
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
        handleAddShips(ws, message);
        break;

      case "attack":
        handleAttack(ws, message);
        break;

      case "randomAttack":
        handleRandomAttack(ws, message);
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
        sendMessage(ws, {
          type: "error",
          data: { error: true, errorText: "Unknown message type" },
          id: 0,
        });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendMessage(ws, {
      type: "error",
      data: { error: true, errorText: "Server error processing your request" },
      id: 0,
    });
  }
}
