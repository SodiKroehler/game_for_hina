import type { Dir, Orientation, PieceType } from "./types";
import { opposite } from "./direction";

/** Pyramid base (o=0): mirror couples N↔E; S and W flat (destroyed). */
const PYRAMID_BASE: (Dir | null)[] = [
  1, // N → E
  0, // E → N
  null, // S
  null, // W
];

/** Scarab base (o=0): N↔E, S↔W pairing. */
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

export function pyramidReflect(orientation: Orientation, beamDir: Dir): Dir | null {
  return rotateReflect(orientation, beamDir, PYRAMID_BASE);
}

export function scarabReflect(orientation: Orientation, beamDir: Dir): Dir {
  const o = orientation as number;
  const loc = (((beamDir - o) % 4) + 4) % 4;
  const out = SCARAB_BASE[loc];
  return ((((out + o) % 4) + 4) % 4) as Dir;
}

/** Anubis orientation = direction its absorbing face points (normal outward). */
export function anubisAbsorbs(orientation: Orientation, beamDir: Dir): boolean {
  const o = orientation as number;
  return opposite(beamDir) === (((o % 4) + 4) % 4);
}

export function pieceLabel(t: PieceType): string {
  switch (t) {
    case "sphinx":
      return "X";
    case "pharaoh":
      return "K";
    case "pyramid":
      return "P";
    case "scarab":
      return "S";
    case "anubis":
      return "A";
  }
}
