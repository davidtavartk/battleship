import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/connectionController';

// Create a function to initialize and start the WebSocket server
export function startGameServer(port: number) {
  console.log(`Starting WebSocket game server on port ${port}...`);
  
  const wss = new WebSocketServer({ port });
  
  wss.on('listening', () => {
    console.log(`WebSocket game server is running on port ${port}`);
  });
  
  wss.on('error', (error) => {
    console.error(`WebSocket game server error:`, error);
  });
  
  // Handle new connections
  wss.on('connection', handleConnection);
  
  // Handle server shutdown gracefully
  process.on('SIGINT', () => {
    console.log('Shutting down WebSocket game server...');
    wss.close(() => {
      console.log('WebSocket game server closed');
      process.exit(0);
    });
  });
  
  return wss;
}

export class App {
  private wss: WebSocketServer;
  
  constructor(port: number) {
    this.wss = startGameServer(port);
  }
}