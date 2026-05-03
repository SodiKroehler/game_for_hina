import type { GameBoard } from "@/lib/gameboard";
import type { Move } from "@/lib/moves";

export type AiEngineModule = {
  makeMove: (gameBoard: GameBoard) => Move | null;
};
