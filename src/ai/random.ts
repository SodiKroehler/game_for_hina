import { GameBoard } from "@/lib/gameboard";
import { traceLaser } from "@/lib/laser";
import type { Move } from "@/lib/moves";
import type { Owner } from "@/lib/piece";

/**
 * AI move selection — preserved behavior from former `src/ai/RandoAI.ts` (win-first, else random).
 * Does not mutate `board`.
 */
export function getMove(board: GameBoard, owner: Owner): Move {
  const legal = board.getLegalMoves(owner);
  if (legal.length === 0) {
    throw new Error("getMove: no legal moves");
  }

  const opponent: Owner = owner === 1 ? 2 : 1;

  for (const m of legal) {
    const trial = board.clone();
    if (!trial.makeMove(m)) continue;
    const result = traceLaser(trial, owner);
    if (result.hit === "pharaoh" && result.hitPosition) {
      const ph = trial.getPiece(result.hitPosition);
      if (ph?.pieceType === "pharaoh" && ph.owner === opponent) {
        return m;
      }
    }
  }

  return legal[Math.floor(Math.random() * legal.length)]!;
}
