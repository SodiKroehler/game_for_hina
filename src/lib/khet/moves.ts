import type { Coord, Grid, Owner, Piece } from "./types";
import { inBounds } from "./direction";
import { getPiece as gp } from "./grid";

function occ(grid: Grid, c: Coord): Piece | null {
  return gp(grid, c);
}

export function canOwnerUseColumn(owner: Owner, col: number): boolean {
  if (col === 0) return owner === 1;
  if (col === 9) return owner === 2;
  return true;
}

const NEIGHBOR_DELTAS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

function swapAllowedTarget(target: Piece): boolean {
  return target.pieceType === "pyramid" || target.pieceType === "anubis";
}

/** Empty-square moves + scarab swaps (adjacent pyramid/anubis any color). */
export function listMoveDestinations(
  grid: Grid,
  from: Coord,
  player: Owner,
): Coord[] {
  const piece = occ(grid, from);
  if (!piece || piece.owner !== player) return [];
  if (piece.pieceType === "sphinx") return [];

  const out: Coord[] = [];

  for (const [dc, dr] of NEIGHBOR_DELTAS) {
    const dest: Coord = { col: from.col + dc, row: from.row + dr };
    if (!inBounds(dest)) continue;
    if (!canOwnerUseColumn(player, dest.col)) continue;

    const target = occ(grid, dest);

    if (piece.pieceType === "scarab") {
      if (target === null) {
        out.push(dest);
      } else if (swapAllowedTarget(target)) {
        out.push(dest);
      }
      continue;
    }

    if (target !== null) continue;
    out.push(dest);
  }

  return out;
}

export function canRotatePiece(grid: Grid, at: Coord, player: Owner): boolean {
  const piece = occ(grid, at);
  return !!(piece && piece.owner === player);
}

/** Applies clockwise rotation (+1 mod 4). */
export function rotatePieceCw(piece: Piece): Piece {
  return {
    ...piece,
    orientation: (piece.orientation + 1) % 4,
  };
}

export function applyMove(grid: Grid, from: Coord, to: Coord): void {
  const a = occ(grid, from)!;
  const b = occ(grid, to);

  if (a.pieceType === "scarab" && b !== null) {
    grid[from.col][from.row] = b;
    grid[to.col][to.row] = a;
    return;
  }

  grid[to.col][to.row] = a;
  grid[from.col][from.row] = null;
}
