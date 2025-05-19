import { WebSocket } from 'ws';

const connections: Set<WebSocket> = new Set();

export function addConnection(ws: WebSocket): void {
  connections.add(ws);
  console.log(`Connection added. Total active connections: ${connections.size}`);
}

export function removeConnection(ws: WebSocket): void {
  connections.delete(ws);
  console.log(`Connection removed. Total active connections: ${connections.size}`);
}

export function getAllConnections(): WebSocket[] {
  return Array.from(connections);
}

export function hasConnection(ws: WebSocket): boolean {
  return connections.has(ws);
}

export function getConnectionCount(): number {
  return connections.size;
}