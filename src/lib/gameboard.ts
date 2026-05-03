/**
 * Stateful board — grid + legality + mutation (preserves logic from former `lib/khet/grid.ts`,
 * `lib/khet/moves.ts`, `lib/khet/classicSetup.ts`).
 */

import type { Orientation, Owner, Piece, PieceType, Position } from "./piece";
import type { Move, MoveAction } from "./moves";

const COLS = 10;
const ROWS = 8;

const NEIGHBOR_DELTAS: [number, number][] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export function inBounds(p: Position): boolean {
  return p.col >= 0 && p.col < COLS && p.row >= 0 && p.row < ROWS;
}

export function canOwnerOccupyCell(owner: Owner, col: number): boolean {
  if (col === 0) return owner === 1;
  if (col === 9) return owner === 2;
  return true;
}

function rotateOrientation(o: Orientation, direction: 1 | -1): Orientation {
  return ((((o as number) + direction) % 4) + 4) % 4 as Orientation;
}

function swapAllowedPiece(target: Piece): boolean {
  return target.pieceType === "pyramid" || target.pieceType === "anubis";
}

function posEq(a: Position, b: Position): boolean {
  return a.col === b.col && a.row === b.row;
}

function actionEq(a: MoveAction, b: MoveAction): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "move" && b.type === "move") return posEq(a.to, b.to);
  if (a.type === "swap" && b.type === "swap") return posEq(a.to, b.to);
  if (a.type === "rotate" && b.type === "rotate") return a.direction === b.direction;
  return false;
}

export function movesEqual(a: Move, b: Move): boolean {
  return posEq(a.from, b.from) && actionEq(a.action, b.action);
}

export class GameBoard {
  /** grid[col][row] — preserved indexing from prior implementation */
  private grid: (Piece | null)[][];

  constructor() {
    this.grid = Array.from({ length: COLS }, () =>
      Array<Piece | null>(ROWS).fill(null),
    );
  }

  addPiece(position: Position, piece: Piece): void {
    this.grid[position.col][position.row] = piece;
  }

  getPiece(position: Position): Piece | null {
    return this.grid[position.col][position.row];
  }

  /** Clears one cell — used by `applyLaserResult` after a trace. */
  removePieceAt(position: Position): void {
    this.grid[position.col][position.row] = null;
  }

  clone(): GameBoard {
    const n = new GameBoard();
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const p = this.grid[c][r];
        n.grid[c][r] = p ? { ...p } : null;
      }
    }
    return n;
  }

  /**
   * Single entry for applying a turn: validates against `getLegalMoves(piece.owner)` then mutates.
   */
  makeMove(move: Move): boolean {
    const piece = this.getPiece(move.from);
    if (!piece) return false;

    const legal = this.getLegalMoves(piece.owner);
    if (!legal.some((m) => movesEqual(m, move))) return false;

    const { from, action } = move;

    switch (action.type) {
      case "rotate": {
        const p = this.getPiece(from)!;
        this.grid[from.col][from.row] = {
          ...p,
          orientation: rotateOrientation(p.orientation, action.direction),
        };
        return true;
      }
      case "move": {
        const a = this.getPiece(from)!;
        const target = this.getPiece(action.to);
        if (target !== null) return false;
        this.grid[action.to.col][action.to.row] = a;
        this.grid[from.col][from.row] = null;
        return true;
      }
      case "swap": {
        const a = this.getPiece(from)!;
        if (a.pieceType !== "scarab") return false;
        const b = this.getPiece(action.to);
        if (!b || !swapAllowedPiece(b)) return false;
        this.grid[from.col][from.row] = b;
        this.grid[action.to.col][action.to.row] = a;
        return true;
      }
      default:
        return false;
    }
  }

  getLegalMoves(owner: Owner): Move[] {
    const out: Move[] = [];

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const from: Position = { col, row };
        const piece = this.getPiece(from);
        if (!piece || piece.owner !== owner) continue;

        if (piece.pieceType === "sphinx") {
          out.push({ from, action: { type: "rotate", direction: 1 } });
          out.push({ from, action: { type: "rotate", direction: -1 } });
          continue;
        }

        for (const [dc, dr] of NEIGHBOR_DELTAS) {
          const to: Position = { col: col + dc, row: row + dr };
          if (!inBounds(to)) continue;
          if (!canOwnerOccupyCell(owner, to.col)) continue;

          const target = this.getPiece(to);

          if (piece.pieceType === "scarab") {
            if (target === null) {
              out.push({ from, action: { type: "move", to } });
            } else if (swapAllowedPiece(target)) {
              out.push({ from, action: { type: "swap", to } });
            }
            continue;
          }

          if (target === null) {
            out.push({ from, action: { type: "move", to } });
          }
        }

        out.push({ from, action: { type: "rotate", direction: 1 } });
        out.push({ from, action: { type: "rotate", direction: -1 } });
      }
    }

    return out;
  }

  /** Internal read-only view for laser tracing (same GameBoard instance; trace must not mutate during trace). */
  get gridSnapshot(): (Piece | null)[][] {
    return this.grid;
  }

  /**
   * Classic Khet 2.0 layout — positions/orientations per project spec.
   * Sphinx silver at (0,0): spec text says “N (fires right)”; actual beam into the board from the
   * corner uses East so the laser enters play (prior numeric-only setup used equivalent physics).
   */
  static classic(): GameBoard {
    const b = new GameBoard();
    const P = (
      pieceType: PieceType,
      orientation: Orientation,
      owner: Owner,
    ): Piece => ({ pieceType, orientation, owner });

    // Silver sphinx — fire East into board (spec narrative “fires right”; storing E = 1)
    b.addPiece({ col: 0, row: 0 }, P("sphinx", 1, 1));
    // Red sphinx — fire North into board from bottom-right (spec lists “S”; South leaves board — using N = 0)
    b.addPiece({ col: 9, row: 7 }, P("sphinx", 0, 2));

    b.addPiece({ col: 4, row: 3 }, P("scarab", 0, 1));
    b.addPiece({ col: 5, row: 3 }, P("scarab", 3, 1));
    b.addPiece({ col: 4, row: 4 }, P("scarab", 1, 2));
    b.addPiece({ col: 5, row: 4 }, P("scarab", 2, 2));

    b.addPiece({ col: 0, row: 3 }, P("pyramid", 0, 1));
    b.addPiece({ col: 0, row: 4 }, P("pyramid", 1, 1));
    b.addPiece({ col: 2, row: 3 }, P("pyramid", 2, 2));
    b.addPiece({ col: 2, row: 4 }, P("pyramid", 3, 2));

    b.addPiece({ col: 7, row: 3 }, P("pyramid", 1, 1));
    b.addPiece({ col: 7, row: 4 }, P("pyramid", 0, 1));
    b.addPiece({ col: 9, row: 3 }, P("pyramid", 3, 2));
    b.addPiece({ col: 9, row: 4 }, P("pyramid", 2, 2));

    b.addPiece({ col: 2, row: 1 }, P("pyramid", 2, 1));
    b.addPiece({ col: 3, row: 2 }, P("pyramid", 3, 2));
    b.addPiece({ col: 7, row: 6 }, P("pyramid", 0, 2));
    b.addPiece({ col: 6, row: 5 }, P("pyramid", 1, 1));

    b.addPiece({ col: 7, row: 0 }, P("pyramid", 0, 1));

    b.addPiece({ col: 4, row: 0 }, P("anubis", 2, 1));
    b.addPiece({ col: 5, row: 0 }, P("pharaoh", 2, 1));
    b.addPiece({ col: 6, row: 0 }, P("anubis", 2, 1));

    b.addPiece({ col: 2, row: 7 }, P("pyramid", 3, 2));
    b.addPiece({ col: 3, row: 7 }, P("anubis", 0, 2));
    b.addPiece({ col: 4, row: 7 }, P("pharaoh", 0, 2));
    b.addPiece({ col: 5, row: 7 }, P("anubis", 0, 2));

    return b;
  }
}
