import type { GameBoard } from "@/lib/gameboard";
import type { Move } from "@/lib/moves";
import { getMove } from "./random";

/** Delegates to `getMove` from `./random` — preserves random / win-first AI behavior. */
export function makeMove(board: GameBoard): Move | null {
  try {
    return getMove(board, 2);
  } catch {
    return null;
  }
}
