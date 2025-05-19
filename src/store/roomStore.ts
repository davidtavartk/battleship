import { Room } from "../types/game";

interface RoomStore {
  rooms: Record<string | number, Room>;
  getAvailableRooms(): Room[];
}

const roomStore: RoomStore = {
  rooms: {},

  getAvailableRooms(): Room[] {
    return (Object.values(this.rooms) as Room[]).filter(
      (room) => room.roomUsers.length < 2
    );
  },
};

export default roomStore;
