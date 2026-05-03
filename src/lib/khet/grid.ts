import type { Coord, Grid, Piece } from "./types";

export function createEmptyGrid(): Grid {
  return Array.from({ length: 10 }, () => Array<null>(8).fill(null));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((col) =>
    col.map((c) => (c ? { ...c } : null)),
  ) as Grid;
}

export function getPiece(grid: Grid, c: Coord): Piece | null {
  return grid[c.col][c.row];
}

export function setPiece(grid: Grid, c: Coord, p: Piece | null): void {
  grid[c.col][c.row] = p;
}

export function findSphinx(grid: Grid, owner: number): Coord | null {
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 8; row++) {
      const p = grid[col][row];
      if (p && p.pieceType === "sphinx" && p.owner === owner) {
        return { col, row };
      }
    }
  }
  return null;
}

export function findPharaoh(grid: Grid, owner: number): Coord | null {
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 8; row++) {
      const p = grid[col][row];
      if (p && p.pieceType === "pharaoh" && p.owner === owner) {
        return { col, row };
      }
    }
  }
  return null;
}
