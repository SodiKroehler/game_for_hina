import type { Grid, Owner, PieceType } from "./types";
import { Orientation } from "./types";
import { createEmptyGrid, setPiece } from "./grid";

export interface Placement {
  col: number;
  row: number;
  pieceType: PieceType;
  orientation: Orientation;
  owner: Owner;
}

/**
 * Classic layout (explicit placements; matches reference ClassicGame Python setup).
 * Silver = player 1, Red = player 2.
 */
export const CLASSIC_PLACEMENTS: Placement[] = [
  // Sphinx
  {
    col: 0,
    row: 0,
    pieceType: "sphinx",
    orientation: Orientation.down,
    owner: 1,
  },
  {
    col: 9,
    row: 7,
    pieceType: "sphinx",
    orientation: Orientation.up,
    owner: 2,
  },

  // Scarabs
  {
    col: 4,
    row: 3,
    pieceType: "scarab",
    orientation: Orientation.up,
    owner: 1,
  },
  {
    col: 5,
    row: 3,
    pieceType: "scarab",
    orientation: Orientation.left,
    owner: 1,
  },
  {
    col: 4,
    row: 4,
    pieceType: "scarab",
    orientation: Orientation.right,
    owner: 2,
  },
  {
    col: 5,
    row: 4,
    pieceType: "scarab",
    orientation: Orientation.down,
    owner: 2,
  },

  // Pyramid — left cluster
  {
    col: 0,
    row: 3,
    pieceType: "pyramid",
    orientation: Orientation.up,
    owner: 1,
  },
  {
    col: 0,
    row: 4,
    pieceType: "pyramid",
    orientation: Orientation.right,
    owner: 1,
  },
  {
    col: 2,
    row: 3,
    pieceType: "pyramid",
    orientation: Orientation.down,
    owner: 2,
  },
  {
    col: 2,
    row: 4,
    pieceType: "pyramid",
    orientation: Orientation.left,
    owner: 2,
  },

  // Pyramid — right cluster
  {
    col: 7,
    row: 3,
    pieceType: "pyramid",
    orientation: Orientation.right,
    owner: 1,
  },
  {
    col: 7,
    row: 4,
    pieceType: "pyramid",
    orientation: Orientation.up,
    owner: 1,
  },
  {
    col: 9,
    row: 3,
    pieceType: "pyramid",
    orientation: Orientation.left,
    owner: 2,
  },
  {
    col: 9,
    row: 4,
    pieceType: "pyramid",
    orientation: Orientation.down,
    owner: 2,
  },

  // Corner pyramids
  {
    col: 2,
    row: 1,
    pieceType: "pyramid",
    orientation: Orientation.down,
    owner: 1,
  },
  {
    col: 3,
    row: 2,
    pieceType: "pyramid",
    orientation: Orientation.left,
    owner: 2,
  },
  {
    col: 7,
    row: 6,
    pieceType: "pyramid",
    orientation: Orientation.up,
    owner: 2,
  },
  {
    col: 6,
    row: 5,
    pieceType: "pyramid",
    orientation: Orientation.right,
    owner: 1,
  },

  // Pharaoh lines — silver (row 0)
  {
    col: 4,
    row: 0,
    pieceType: "anubis",
    orientation: Orientation.down,
    owner: 1,
  },
  {
    col: 5,
    row: 0,
    pieceType: "pharaoh",
    orientation: Orientation.down,
    owner: 1,
  },
  {
    col: 6,
    row: 0,
    pieceType: "anubis",
    orientation: Orientation.down,
    owner: 1,
  },
  {
    col: 7,
    row: 0,
    pieceType: "pyramid",
    orientation: Orientation.up,
    owner: 1,
  },

  // Pharaoh lines — red (row 7)
  {
    col: 2,
    row: 7,
    pieceType: "pyramid",
    orientation: Orientation.left,
    owner: 2,
  },
  {
    col: 3,
    row: 7,
    pieceType: "anubis",
    orientation: Orientation.up,
    owner: 2,
  },
  {
    col: 4,
    row: 7,
    pieceType: "pharaoh",
    orientation: Orientation.up,
    owner: 2,
  },
  {
    col: 5,
    row: 7,
    pieceType: "anubis",
    orientation: Orientation.up,
    owner: 2,
  },
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
