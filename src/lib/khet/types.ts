export type Owner = 1 | 2;

export type PieceType =
  | "sphinx"
  | "pharaoh"
  | "pyramid"
  | "scarab"
  | "anubis";

/** Laser travel / beam direction: 0=N, 1=E, 2=S, 3=W (screen coords, row grows downward). */
export type Dir = 0 | 1 | 2 | 3;

/**
 * Piece facing / sphinx laser emission — matches Python-style `Orientation.up` … `Orientation.left`.
 * Values align with {@link Dir}: up=N, right=E, down=S, left=W.
 */
export enum Orientation {
  up = 0,
  right = 1,
  down = 2,
  left = 3,
}

export interface Piece {
  pieceType: PieceType;
  orientation: Orientation;
  owner: Owner;
}

export type Cell = Piece | null;

/** grid[col][row] — 10×8, origin top-left. */
export type Grid = Cell[][];

export interface Coord {
  col: number;
  row: number;
}

export type LaserOutcome =
  | { kind: "edge" }
  | { kind: "sphinx" }
  | { kind: "absorb" }
  | { kind: "pharaoh"; loser: Owner }
  | { kind: "destroy"; at: Coord; piece: Piece };

export interface LaserTrace {
  /** Cell centers visited in order (each step enters a new cell). */
  path: Coord[];
  outcome: LaserOutcome;
}

export interface GameState {
  grid: Grid;
  currentPlayer: Owner;
  winner: Owner | null;
}

export type AiAction =
  | { pieceCoord: Coord; action: "move"; destination: Coord }
  | { pieceCoord: Coord; action: "rotate"; destination: Coord };
