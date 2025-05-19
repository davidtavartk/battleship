export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

let nextId = 1;
export function getNextId(): number {
  return nextId++;
}