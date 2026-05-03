/** Types-only module — move descriptions and laser trace shape (no behavior). */

import type { Position } from "./piece";

export type MoveAction =
  | { type: "move"; to: Position }
  | { type: "rotate"; direction: 1 | -1 }
  | { type: "swap"; to: Position };

export type Move = { from: Position; action: MoveAction };

export type LaserResult = {
  path: Position[];
  hit: "pharaoh" | "piece" | "wall" | null;
  hitPosition: Position | null;
};
