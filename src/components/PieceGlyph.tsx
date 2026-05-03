import type { Orientation, Owner, PieceType } from "@/lib/piece";
import { pieceLabel } from "@/lib/piece";

const silverFill = "#e2e8f0";
const silverStroke = "#64748b";
const redFill = "#ea580c";
const redStroke = "#fdba74";

function colors(owner: Owner) {
  return owner === 1
    ? { fill: silverFill, stroke: silverStroke, text: "#0f172a" }
    : { fill: redFill, stroke: redStroke, text: "#fff7ed" };
}

/** Glyph rendering — preserved from earlier `PieceGlyph` implementation. */
export function PyramidGlyph({
  owner,
  orientation,
}: {
  owner: Owner;
  orientation: Orientation;
}) {
  const { fill, stroke } = colors(owner);
  const o = orientation as number;
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[85%] w-[85%] max-h-[52px] max-w-[52px] drop-shadow-md"
      aria-hidden
    >
      <g transform={`rotate(${o * 90} 50 50)`}>
        <polygon
          points="100,100 100,0 0,0"
          fill={fill}
          stroke={stroke}
          strokeWidth={3}
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}

export function ScarabGlyph({
  owner,
  orientation,
}: {
  owner: Owner;
  orientation: Orientation;
}) {
  const { fill, stroke } = colors(owner);
  const o = orientation as number;
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[85%] w-[85%] max-h-[52px] max-w-[52px] drop-shadow-md"
      aria-hidden
    >
      <g transform={`rotate(${o * 90} 50 50)`}>
        <g transform="rotate(45 50 50)">
          <rect
            x="12"
            y="38"
            width="76"
            height="24"
            rx={3}
            fill={fill}
            stroke={stroke}
            strokeWidth={3}
          />
        </g>
      </g>
    </svg>
  );
}

function CircleGlyph({
  owner,
  orientation,
  label,
}: {
  owner: Owner;
  orientation: Orientation;
  label: string;
}) {
  const { fill, stroke, text } = colors(owner);
  return (
    <span
      className="flex h-[85%] w-[85%] max-h-[52px] max-w-[52px] items-center justify-center rounded-full text-sm font-bold shadow-md border-2"
      style={{
        backgroundColor: fill,
        borderColor: stroke,
        color: text,
        transform: `rotate(${(orientation as number) * 90}deg)`,
      }}
    >
      {label}
    </span>
  );
}

export function PieceGlyph(props: {
  pieceType: PieceType;
  owner: Owner;
  orientation: Orientation;
}) {
  const { pieceType, owner, orientation } = props;
  switch (pieceType) {
    case "pyramid":
      return <PyramidGlyph owner={owner} orientation={orientation} />;
    case "scarab":
      return <ScarabGlyph owner={owner} orientation={orientation} />;
    default:
      return (
        <CircleGlyph
          owner={owner}
          orientation={orientation}
          label={pieceLabel(pieceType)}
        />
      );
  }
}
