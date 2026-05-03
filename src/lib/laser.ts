/**
 * Laser simulation — pure trace + deferred removal (preserves reflection/absorption rules from `lib/khet/pieces.ts` + `lib/khet/laser.ts`).
 */

import type { GameBoard } from "./gameboard";
import { inBounds } from "./gameboard";
import type { LaserResult } from "./moves";
import type { Orientation, Owner, Piece, Position } from "./piece";

/** Beam direction matches {@link Orientation}: N,E,S,W */
type Dir = Orientation;

const MAX_STEPS = 400;

const DELTA: Record<Dir, { dc: number; dr: number }> = {
  0: { dc: 0, dr: -1 },
  1: { dc: 1, dr: 0 },
  2: { dc: 0, dr: 1 },
  3: { dc: -1, dr: 0 },
};

function opposite(d: Dir): Dir {
  return ((((d + 2) % 4) + 4) % 4) as Dir;
}

function step(p: Position, d: Dir): Position {
  const { dc, dr } = DELTA[d];
  return { col: p.col + dc, row: p.row + dr };
}

/** Pyramid base (o=0): mirror couples N↔E; S and W flat — preserved */
const PYRAMID_BASE: (Dir | null)[] = [1, 0, null, null];

/** Scarab base (o=0): N↔E, S↔W — preserved */
const SCARAB_BASE: Dir[] = [1, 0, 3, 2];

function rotateReflect(
  orientation: Orientation,
  beamDir: Dir,
  baseTable: (Dir | null)[],
): Dir | null {
  const o = orientation as number;
  const loc = (((beamDir - o) % 4) + 4) % 4;
  const out = baseTable[loc];
  if (out === null) return null;
  return ((((out + o) % 4) + 4) % 4) as Dir;
}

function pyramidReflect(o: Orientation, beamDir: Dir): Dir | null {
  return rotateReflect(o, beamDir, PYRAMID_BASE);
}

function scarabReflect(o: Orientation, beamDir: Dir): Dir {
  const x = orientation as number;
  const loc = (((beamDir - x) % 4) + 4) % 4;
  const out = SCARAB_BASE[loc];
  return ((((out + x) % 4) + 4) % 4) as Dir;
}

function anubisAbsorbs(o: Orientation, beamDir: Dir): boolean {
  const n = o as number;
  return opposite(beamDir) === (((n % 4) + 4) % 4);
}

function resolvePiece(piece: Piece, beamDir: Dir): {
  nextDir: Dir | null;
  terminal:
    | "pharaoh"
    | "destroy"
    | "sphinx"
    | "absorb"
    | null;
} {
  const o = piece.orientation;

  switch (piece.pieceType) {
    case "sphinx":
      return { nextDir: null, terminal: "sphinx" };
    case "pharaoh":
      return { nextDir: null, terminal: "pharaoh" };
    case "pyramid": {
      const nd = pyramidReflect(o, beamDir);
      if (nd === null) return { nextDir: null, terminal: "destroy" };
      return { nextDir: nd, terminal: null };
    }
    case "scarab":
      return { nextDir: scarabReflect(o, beamDir), terminal: null };
    case "anubis":
      if (anubisAbsorbs(o, beamDir)) {
        return { nextDir: null, terminal: "absorb" };
      }
      return { nextDir: null, terminal: "destroy" };
    default:
      return { nextDir: null, terminal: null };
  }
}

function findSphinx(board: GameBoard, owner: Owner): {
  pos: Position;
  piece: Piece;
} | null {
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 8; row++) {
      const p = board.getPiece({ col, row });
      if (p && p.pieceType === "sphinx" && p.owner === owner) {
        return { pos: { col, row }, piece: p };
      }
    }
  }
  return null;
}

/**
 * Pure trace — does not mutate `board`. Destroyed pieces are indicated via `hit` / `hitPosition` only.
 */
export function traceLaser(board: GameBoard, owner: Owner): LaserResult {
  const start = findSphinx(board, owner);
  if (!start) {
    return { path: [], hit: "wall", hitPosition: null };
  }

  let beamDir = start.piece.orientation as Dir;
  let pos = step(start.pos, beamDir);
  const path: Position[] = [];
  let steps = 0;

  while (steps++ < MAX_STEPS) {
    if (!inBounds(pos)) {
      return { path, hit: "wall", hitPosition: null };
    }

    path.push({ ...pos });
    const piece = board.getPiece(pos);

    if (piece === null) {
      pos = step(pos, beamDir);
      continue;
    }

    const { nextDir, terminal } = resolvePiece(piece, beamDir);

    if (terminal === "pharaoh") {
      return { path, hit: "pharaoh", hitPosition: { ...pos } };
    }
    if (terminal === "sphinx" || terminal === "absorb") {
      return { path, hit: null, hitPosition: null };
    }
    if (terminal === "destroy") {
      return { path, hit: "piece", hitPosition: { ...pos } };
    }

    if (nextDir !== null) {
      beamDir = nextDir;
      pos = step(pos, beamDir);
      continue;
    }

    return { path, hit: null, hitPosition: null };
  }

  return { path, hit: null, hitPosition: null };
}

/** Applies removals implied by a trace (caller determines win state). */
export function applyLaserResult(board: GameBoard, result: LaserResult): void {
  if (
    (result.hit === "pharaoh" || result.hit === "piece") &&
    result.hitPosition
  ) {
    board.removePieceAt(result.hitPosition);
  }
}

/** SVG polyline points in unit-cell space (preserved helper from former `lib/khet/laser.ts`). */
export function pathToSegments(path: Position[]): { x: number; y: number }[] {
  return path.map((p) => ({ x: p.col + 0.5, y: p.row + 0.5 }));
}
