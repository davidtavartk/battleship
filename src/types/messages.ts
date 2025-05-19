export interface BaseMessage {
  type: string;
  data: any;
  id: number;
}

export interface RegMessage extends BaseMessage {
  type: "reg";
  data: {
    name: string;
    password: string;
  };
}

export interface RoomMessage extends BaseMessage {
  type: "create_room" | "add_user_to_room";
  data: string | { indexRoom: string | number };
}

export interface ShipsMessage extends BaseMessage {
  type: "add_ships";
  data: {
    gameId: string | number;
    ships: Ship[];
    indexPlayer: string | number;
  };
}

export interface AttackMessage extends BaseMessage {
  type: "attack";
  data: {
    gameId: string | number;
    x: number;
    y: number;
    indexPlayer: string | number;
  };
}

export interface RandomAttackMessage extends BaseMessage {
  type: "randomAttack";
  data: {
    gameId: string | number;
    indexPlayer: string | number;
  };
}
