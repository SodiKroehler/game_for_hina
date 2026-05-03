/** Types-only module — piece identities on the board (no behavior). */

export type PieceType = "pyramid" | "scarab" | "anubis" | "pharaoh" | "sphinx";

/** 1 = silver, 2 = red */
export type Owner = 1 | 2;

/** North = 0, East = 1, South = 2, West = 3 (screen coords; row grows downward). */
export type Orientation = 0 | 1 | 2 | 3;

export type Position = { col: number; row: number };

export type Piece = {
  pieceType: PieceType;
  orientation: Orientation;
  owner: Owner;
};

/** Letter labels for circles — preserved from former `lib/khet/pieces.ts`. */
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
