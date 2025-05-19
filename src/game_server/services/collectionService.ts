// src/game_server/services/connectionService.ts
import { WebSocket } from 'ws';

// Track all active WebSocket connections
const connections: Set<WebSocket> = new Set();

/**
 * Register a new WebSocket connection
 * @param ws The WebSocket connection to register
 */
export function addConnection(ws: WebSocket): void {
  connections.add(ws);
  console.log(`Connection added. Total active connections: ${connections.size}`);
}

/**
 * Remove a WebSocket connection when it closes
 * @param ws The WebSocket connection to remove
 */
export function removeConnection(ws: WebSocket): void {
  connections.delete(ws);
  console.log(`Connection removed. Total active connections: ${connections.size}`);
}

/**
 * Get all active WebSocket connections
 * @returns Array of all active WebSocket connections
 */
export function getAllConnections(): WebSocket[] {
  return Array.from(connections);
}

/**
 * Check if a WebSocket connection is registered
 * @param ws The WebSocket connection to check
 * @returns True if the connection is registered, false otherwise
 */
export function hasConnection(ws: WebSocket): boolean {
  return connections.has(ws);
}

/**
 * Get the total number of active connections
 * @returns The count of active connections
 */
export function getConnectionCount(): number {
  return connections.size;
}