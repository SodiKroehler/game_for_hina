import { enumerateLegalActions } from "@/lib/khet/ai";
import type { GameBoard, Move } from "./types";

/** Uniform random legal move or rotation for red (player 2). */
export function makeMove(gameBoard: GameBoard): Move | null {
  if (gameBoard.winner !== null || gameBoard.currentPlayer !== 2) return null;
  const actions = enumerateLegalActions(gameBoard.grid, 2);
  if (actions.length === 0) return null;
  const pick = actions[Math.floor(Math.random() * actions.length)];
  return pick ?? null;
}
