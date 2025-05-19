import { generateId } from "../utils/idGenerator";
import { Room } from "../types/game";
import { Player } from "../types/game";
import { broadcastRoomsToAll } from "../services/broadcastService";  // Fixed import

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

  broadcastRoomsToAll();

  return newRoom;
}

export function addPlayerToRoom(
  roomId: string | number,
  playerId: string | number,
  player: Player
): Room | null {
  const room = rooms[roomId as string];

  if (!room) {
    return null;
  }

  if (room.roomUsers.length >= 2) {
    return null;
  }

  room.roomUsers.push({
    name: player.name,
    index: playerId,
  });

  broadcastRoomsToAll();

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
  broadcastRoomsToAll();
}