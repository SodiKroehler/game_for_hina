import type { AiAction, Coord, GameState, Grid, Owner } from "./types";
import { cloneGrid } from "./grid";
import { traceLaser } from "./laser";
import {
  applyMove,
  canRotatePiece,
  listMoveDestinations,
  rotatePieceCw,
} from "./moves";
import { getPiece } from "./grid";

/** Apply a move or in-place rotation for the given player action. */
export function applyGameAction(grid: Grid, action: AiAction): void {
  if (action.action === "rotate") {
    const p = getPiece(grid, action.pieceCoord)!;
    grid[action.pieceCoord.col][action.pieceCoord.row] = rotatePieceCw(p);
    return;
  }
  applyMove(grid, action.pieceCoord, action.destination);
}

/** Returns true if this action lets player `firer` immediately strike the opponent pharaoh. */
export function isImmediatePharaohWin(
  gridBefore: Grid,
  firer: Owner,
  action: AiAction,
): boolean {
  const g = cloneGrid(gridBefore);
  applyGameAction(g, action);
  const trace = traceLaser(g, firer);
  if (trace.outcome.kind !== "pharaoh") return false;
  const opp: Owner = firer === 1 ? 2 : 1;
  return trace.outcome.loser === opp;
}

/** Legal actions for `player` (all moves + in-place rotations). */
export function enumerateLegalActions(grid: Grid, player: Owner): AiAction[] {
  const actions: AiAction[] = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 8; row++) {
      const c: Coord = { col, row };
      const piece = getPiece(grid, c);
      if (!piece || piece.owner !== player) continue;

      for (const dest of listMoveDestinations(grid, c, player)) {
        actions.push({
          pieceCoord: c,
          action: "move",
          destination: dest,
        });
      }

      if (canRotatePiece(grid, c, player)) {
        actions.push({
          pieceCoord: c,
          action: "rotate",
          destination: { ...c },
        });
      }
    }
  }
  return actions;
}

/**
 * AI plays as red (player 2). Prefers any move that immediately hits silver's pharaoh;
 * otherwise picks uniformly at random among legal moves + rotations.
 */
export function makeMove(state: GameState): AiAction | null {
  if (state.winner !== null) return null;
  if (state.currentPlayer !== 2) return null;

  const actions = enumerateLegalActions(state.grid, 2);
  if (actions.length === 0) return null;

  const wins = actions.filter((a) =>
    isImmediatePharaohWin(state.grid, 2, a),
  );
  const pool = wins.length > 0 ? wins : actions;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick;
}
