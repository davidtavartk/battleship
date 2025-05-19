import { generateId } from "../utils/idGenerator";
import { Room } from "../types/game";
import { Player } from "../types/game";
import { broadcastUpdateRooms } from "../game_server/controllers/messageController";

// In-memory database for rooms
const rooms: Record<string, Room> = {};

export function createRoom(playerId: string | number, player: Player): Room {
  const roomId = generateId();
  const newRoom: Room = {
    roomId,
    roomUsers: [
      {
        name: player.name,
        index: playerId,
      },
    ],
  };

  rooms[roomId] = newRoom;

  // Broadcast updated room list
  broadcastUpdateRooms();

  return newRoom;
}

export function addPlayerToRoom(
  roomId: string | number,
  playerId: string | number,
  player: Player
): Room | null {
  const room = rooms[roomId as string];

  if (!room) {
    return null; // Room not found
  }

  if (room.roomUsers.length >= 2) {
    return null; // Room is full
  }

  // Add player to room
  room.roomUsers.push({
    name: player.name,
    index: playerId,
  });

  // If room is now full, remove it from available rooms
  if (room.roomUsers.length === 2) {
    // Room is full, remove from available list
    // This will be handled by filtering in the getAvailableRooms function
  }

  // Broadcast updated room list
  broadcastUpdateRooms();

  return room;
}

export function getRoom(roomId: string | number): Room | undefined {
  return rooms[roomId as string];
}

export function getAvailableRooms(): Room[] {
  return Object.values(rooms).filter((room) => room.roomUsers.length < 2);
}

export function deleteRoom(roomId: string | number): void {
  delete rooms[roomId as string];
  broadcastUpdateRooms();
}
