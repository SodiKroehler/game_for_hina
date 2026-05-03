import type { Grid, Owner, PieceType } from "./types";
import { createEmptyGrid, setPiece } from "./grid";

export interface Placement {
  col: number;
  row: number;
  pieceType: PieceType;
  orientation: number;
  owner: Owner;
}

/** Half-board Classic-style layout (player 2 / red, rows 0–3); silver side is 180° mirror. */
const RED_SIDE: Placement[] = [
  { col: 0, row: 0, pieceType: "sphinx", orientation: 2, owner: 2 },
  { col: 3, row: 0, pieceType: "pyramid", orientation: 3, owner: 2 },
  { col: 6, row: 0, pieceType: "pyramid", orientation: 2, owner: 2 },
  { col: 2, row: 1, pieceType: "pyramid", orientation: 1, owner: 2 },
  { col: 5, row: 1, pieceType: "scarab", orientation: 0, owner: 2 },
  { col: 8, row: 1, pieceType: "pyramid", orientation: 3, owner: 2 },
  { col: 1, row: 2, pieceType: "anubis", orientation: 2, owner: 2 },
  { col: 4, row: 2, pieceType: "pharaoh", orientation: 0, owner: 2 },
  { col: 7, row: 2, pieceType: "anubis", orientation: 2, owner: 2 },
  { col: 3, row: 3, pieceType: "pyramid", orientation: 0, owner: 2 },
  { col: 6, row: 3, pieceType: "pyramid", orientation: 2, owner: 2 },
  { col: 9, row: 3, pieceType: "pyramid", orientation: 3, owner: 2 },
];

function mirrorPlacement(p: Placement): Placement {
  return {
    col: 9 - p.col,
    row: 7 - p.row,
    owner: p.owner === 1 ? 2 : 1,
    pieceType: p.pieceType,
    orientation: (p.orientation + 2) % 4,
  };
}

/** Full Classic starting grid (mirrored Classic layout). */
export const CLASSIC_PLACEMENTS: Placement[] = [
  ...RED_SIDE,
  ...RED_SIDE.map(mirrorPlacement),
];

export function createClassicGrid(): Grid {
  const grid = createEmptyGrid();
  for (const pl of CLASSIC_PLACEMENTS) {
    const piece = {
      pieceType: pl.pieceType,
      orientation: pl.orientation,
      owner: pl.owner,
    };
    setPiece(grid, { col: pl.col, row: pl.row }, piece);
  }
  return grid;
}
