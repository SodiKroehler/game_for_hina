import type { Coord, Dir } from "./types";

export const DIRS: Dir[] = [0, 1, 2, 3];

/** Delta per step in direction `d` for (col, row). */
export const DELTA: Record<Dir, { dc: number; dr: number }> = {
  0: { dc: 0, dr: -1 }, // N
  1: { dc: 1, dr: 0 }, // E
  2: { dc: 0, dr: 1 }, // S
  3: { dc: -1, dr: 0 }, // W
};

export function opposite(d: Dir): Dir {
  return (((d + 2) % 4) as Dir);
}

export function step(coord: Coord, d: Dir): Coord {
  const { dc, dr } = DELTA[d];
  return { col: coord.col + dc, row: coord.row + dr };
}

export function inBounds(c: Coord): boolean {
  return c.col >= 0 && c.col < 10 && c.row >= 0 && c.row < 8;
}
