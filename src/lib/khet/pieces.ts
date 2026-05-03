import type { Dir, PieceType } from "./types";
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
  orientation: number,
  beamDir: Dir,
  baseTable: (Dir | null)[],
): Dir | null {
  const loc = (((beamDir - orientation) % 4) + 4) % 4;
  const out = baseTable[loc];
  if (out === null) return null;
  return ((((out + orientation) % 4) + 4) % 4) as Dir;
}

export function pyramidReflect(orientation: number, beamDir: Dir): Dir | null {
  return rotateReflect(orientation, beamDir, PYRAMID_BASE);
}

export function scarabReflect(orientation: number, beamDir: Dir): Dir {
  const loc = (((beamDir - orientation) % 4) + 4) % 4;
  const out = SCARAB_BASE[loc];
  return ((((out + orientation) % 4) + 4) % 4) as Dir;
}

/** Anubis orientation = direction its absorbing face points (normal outward). */
export function anubisAbsorbs(orientation: number, beamDir: Dir): boolean {
  return opposite(beamDir) === (((orientation % 4) + 4) % 4);
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
