import type { AiAction, Grid, Owner } from "@/lib/khet/types";

/** Snapshot passed to AI engines (same shape as game state). */
export interface GameBoard {
  grid: Grid;
  currentPlayer: Owner;
  winner: Owner | null;
}

export type Move = AiAction;

export type AiEngineModule = {
  makeMove: (gameBoard: GameBoard) => Move | null;
};
