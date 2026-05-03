import type {
  Coord,
  Dir,
  Grid,
  LaserOutcome,
  LaserTrace,
  Owner,
  Piece,
} from "./types";
import { inBounds, step } from "./direction";
import { getPiece } from "./grid";
import {
  anubisAbsorbs,
  pyramidReflect,
  scarabReflect,
} from "./pieces";

const MAX_STEPS = 400;

function resolvePiece(
  piece: Piece,
  beamDir: Dir,
): { nextDir: Dir | null; outcome: LaserOutcome | null } {
  const o = ((piece.orientation % 4) + 4) % 4;

  switch (piece.pieceType) {
    case "sphinx":
      return { nextDir: null, outcome: { kind: "sphinx" } };
    case "pharaoh":
      return { nextDir: null, outcome: { kind: "pharaoh", loser: piece.owner } };
    case "pyramid": {
      const nd = pyramidReflect(o, beamDir);
      if (nd === null) {
        return {
          nextDir: null,
          outcome: null,
        };
      }
      return { nextDir: nd, outcome: null };
    }
    case "scarab":
      return { nextDir: scarabReflect(o, beamDir), outcome: null };
    case "anubis":
      if (anubisAbsorbs(o, beamDir)) {
        return { nextDir: null, outcome: { kind: "absorb" } };
      }
      return { nextDir: null, outcome: null };
    default:
      return { nextDir: null, outcome: { kind: "edge" } };
  }
}

/**
 * Traces laser from the active player's sphinx without mutating the grid.
 * If a pyramid would be destroyed, `destroy` describes it; pharaoh hit ends the game.
 */
export function traceLaser(grid: Grid, firingPlayer: Owner): LaserTrace {
  const start = (() => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 8; row++) {
        const p = grid[col][row];
        if (
          p &&
          p.pieceType === "sphinx" &&
          p.owner === firingPlayer
        ) {
          return { coord: { col, row } as Coord, sphinx: p };
        }
      }
    }
    return null;
  })();

  if (!start) {
    return { path: [], outcome: { kind: "edge" } };
  }

  let beamDir = (((start.sphinx.orientation % 4) + 4) % 4) as Dir;
  let pos = step(start.coord, beamDir);
  const path: Coord[] = [];
  let steps = 0;

  while (steps++ < MAX_STEPS) {
    if (!inBounds(pos)) {
      return { path, outcome: { kind: "edge" } };
    }

    path.push({ ...pos });
    const piece = getPiece(grid, pos);

    if (piece === null) {
      pos = step(pos, beamDir);
      continue;
    }

    const { nextDir, outcome } = resolvePiece(piece, beamDir);

    if (outcome?.kind === "pharaoh") {
      return { path, outcome };
    }
    if (outcome?.kind === "sphinx") {
      return { path, outcome };
    }
    if (outcome?.kind === "absorb") {
      return { path, outcome };
    }

    if (piece.pieceType === "pyramid" && nextDir === null) {
      return {
        path,
        outcome: {
          kind: "destroy",
          at: { ...pos },
          piece: piece,
        },
      };
    }

    if (piece.pieceType === "anubis" && nextDir === null) {
      return {
        path,
        outcome: {
          kind: "destroy",
          at: { ...pos },
          piece: piece,
        },
      };
    }

    if (nextDir !== null) {
      beamDir = nextDir;
      pos = step(pos, beamDir);
      continue;
    }

    return { path, outcome: { kind: "edge" } };
  }

  return { path, outcome: { kind: "edge" } };
}

/** Builds SVG-friendly polyline points (cell center coords in abstract grid units). */
export function pathToSegments(path: Coord[]): { x: number; y: number }[] {
  return path.map((p) => ({ x: p.col + 0.5, y: p.row + 0.5 }));
}

/** Applies destroy outcome to `grid`. Returns winner when a pharaoh is hit. */
export function applyTraceResult(
  grid: Grid,
  trace: LaserTrace,
): Owner | null {
  const o = trace.outcome;
  if (o.kind === "destroy") {
    grid[o.at.col][o.at.row] = null;
    return null;
  }
  if (o.kind === "pharaoh") {
    return (o.loser === 1 ? 2 : 1) as Owner;
  }
  return null;
}
