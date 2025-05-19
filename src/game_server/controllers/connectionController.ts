import { WebSocket } from "ws";
import { handleMessage } from "./messageController";

export function handleConnection(ws: WebSocket) {
  console.log("👤 New client connected");

  ws.on("message", (message) => {
    let parsed: any;
    try {
      parsed = JSON.parse(message.toString());
    } catch (err) {
      console.error("⚠️  Error parsing message:", err);
      return;
    }
    console.log(`🔄 Received request of type: '${parsed.type}'`);

    handleMessage(ws, parsed);
  });

  ws.on("close", () => {
    console.log("👋 Client disconnected");
  });
}

export function sendMessage(
  ws: WebSocket,
  type: string,
  data: any,
  id: number = 0
) {
  if (ws.readyState !== WebSocket.OPEN) return;

  const payload = {
    type,
    data: typeof data === "string" ? data : JSON.stringify(data),
    id,
  };

  const jsonString = JSON.stringify(payload);
  ws.send(jsonString);

  console.log(`Sent JSON: ${jsonString}`);
}
export function sendErrorMessage(ws: WebSocket, errorText: string) {
  sendMessage(ws, "error", { error: true, errorText });
}
