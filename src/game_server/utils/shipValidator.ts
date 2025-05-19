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

export function validateShips(ships: any[]) {
  if (!Array.isArray(ships) || ships.length !== 10) {
    return false;
  }
  
  // Count ships by type
  const shipCounts: Record<string, number> = {
    huge: 0,
    large: 0,
    medium: 0,
    small: 0
  };
  
  // Check for each ship
  for (const ship of ships) {
    if (!ship.position || typeof ship.position.x !== 'number' || typeof ship.position.y !== 'number') {
      return false;
    }
    
    if (typeof ship.direction !== 'boolean') {
      return false;
    }
    
    if (!ship.type || !ship.length) {
      return false;
    }
    
    // Validate ship is on the board
    const x = ship.position.x;
    const y = ship.position.y;
    const length = ship.length;
    const direction = ship.direction;
    
    if (x < 0 || x > 9 || y < 0 || y > 9) {
      return false;
    }
    
    if (direction) { // vertical
      if (y + length > 10) {
        return false;
      }
    } else { // horizontal
      if (x + length > 10) {
        return false;
      }
    }
    
    // Count by type - check if it's a valid ship type first
    const shipType = ship.type;
    if (shipType === 'huge' || shipType === 'large' || shipType === 'medium' || shipType === 'small') {
      shipCounts[shipType]++;
    } else {
      return false; // Invalid ship type
    }
  }
  
  // Validate ship counts
  if (shipCounts.huge !== 1 || shipCounts.large !== 2 || shipCounts.medium !== 3 || shipCounts.small !== 4) {
    return false;
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