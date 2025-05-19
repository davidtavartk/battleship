import { Ship, ShipType, Position } from '../types/game';

const SHIP_LENGTHS: Record<ShipType, number> = {
  small: 1,
  medium: 2,
  large: 3,
  huge: 4
};

const REQUIRED_SHIPS: Record<ShipType, number> = {
  small: 4,
  medium: 3,
  large: 2,
  huge: 1
};

export function validateShips(ships: Ship[]): boolean {
  if (!ships || !Array.isArray(ships)) {
    return false;
  }
  
  const shipCounts: Record<ShipType, number> = {
    small: 0,
    medium: 0,
    large: 0,
    huge: 0
  };
  
  for (const ship of ships) {
    shipCounts[ship.type]++;
  }
  
  for (const type of Object.keys(REQUIRED_SHIPS) as ShipType[]) {
    if (shipCounts[type] !== REQUIRED_SHIPS[type]) {
      return false;
    }
  }
  
  for (const ship of ships) {
    if (ship.length !== SHIP_LENGTHS[ship.type]) {
      return false;
    }
  }
  
  for (const ship of ships) {
    const positions = getShipPositions(ship);
    
    for (const pos of positions) {
      if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9) {
        return false;
      }
    }
  }
  
  const occupiedPositions: Position[] = [];
  
  for (const ship of ships) {
    const positions = getShipPositions(ship);
    
    for (const pos of positions) {
      if (occupiedPositions.some(p => p.x === pos.x && p.y === pos.y)) {
        return false;
      }
      occupiedPositions.push(pos);
    }
  }
  
  for (const ship of ships) {
    const shipPositions = getShipPositions(ship);
    const surroundingPositions = getSurroundingPositions(shipPositions);
    
    for (const pos of surroundingPositions) {
      if (occupiedPositions.some(p => 
        p.x === pos.x && 
        p.y === pos.y && 
        !shipPositions.some(sp => sp.x === pos.x && sp.y === pos.y)
      )) {
        return false;
      }
    }
  }
  
  return true;
}

function getShipPositions(ship: Ship): Position[] {
  const positions: Position[] = [];
  const { position, direction, length } = ship;
  
  for (let i = 0; i < length; i++) {
    if (direction) {
      positions.push({ x: position.x + i, y: position.y });
    } else {
      positions.push({ x: position.x, y: position.y + i });
    }
  }
  
  return positions;
}

function getSurroundingPositions(positions: Position[]): Position[] {
  const surrounding: Position[] = [];
  const minX = Math.max(0, Math.min(...positions.map(p => p.x)) - 1);
  const maxX = Math.min(9, Math.max(...positions.map(p => p.x)) + 1);
  const minY = Math.max(0, Math.min(...positions.map(p => p.y)) - 1);
  const maxY = Math.min(9, Math.max(...positions.map(p => p.y)) + 1);
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      surrounding.push({ x, y });
    }
  }
  
  return surrounding;
}