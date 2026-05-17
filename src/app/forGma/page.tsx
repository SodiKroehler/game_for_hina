"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { forGmaAssets } from "./assets";
import { ButterflyOverlay } from "./butterfly";

const GRID = 5;
const RED_COUNT = 7;
const CELL_COUNT = GRID * GRID;
const VITALITY_DECAY_MS = 5_000;
const REVITALIZE_PAUSE_MS = 30_000;

type Cell =
  | { kind: "empty" }
  | { kind: "bud" }
  | { kind: "flower"; vitality: number; pauseDecayUntil: number };

function pickRedIndices(): number[] {
  const indices = new Set<number>();
  while (indices.size < RED_COUNT) {
    indices.add(Math.floor(Math.random() * CELL_COUNT));
  }
  return Array.from(indices);
}

function pickRandomIndex(candidates: number[]): number | null {
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function buildInitialCells(): Cell[] {
  const cells: Cell[] = Array.from({ length: CELL_COUNT }, () => ({
    kind: "empty" as const,
  }));
  for (const i of pickRedIndices()) {
    cells[i] = { kind: "bud" };
  }
  return cells;
}

function newFlower(): Cell {
  return { kind: "flower", vitality: 1, pauseDecayUntil: 0 };
}

function flowerVisuals(vitality: number): CSSProperties {
  if (vitality > 0.6) return {};
  if (vitality > 0.2) {
    const t = (0.6 - vitality) / 0.4;
    const sat = 1 - t * 0.85;
    return { filter: `saturate(${sat}) sepia(${t * 0.2})` };
  }
  return {
    filter: "saturate(0.12) sepia(0.22)",
    opacity: vitality / 0.2,
  };
}

export default function ForGmaPage() {
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  useEffect(() => {
    setCells(buildInitialCells());
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      setCells((prev) => {
        if (!prev) return prev;
        let changed = false;
        const next = prev.map((cell) => {
          if (cell.kind !== "flower") return cell;
          if (now < cell.pauseDecayUntil) return cell;
          const vitality = Math.max(0, cell.vitality - dt / VITALITY_DECAY_MS);
          if (vitality === cell.vitality) return cell;
          changed = true;
          if (vitality <= 0) return { kind: "empty" as const };
          return { ...cell, vitality };
        });
        return changed ? next : prev;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const budsRemaining = useMemo(
    () => (cells ? cells.filter((c) => c.kind === "bud").length : 0),
    [cells]
  );

  useEffect(() => {
    if (!cells || budsRemaining !== 0) return;
    setCells(buildInitialCells());
  }, [cells, budsRemaining]);

  const handleCellTap = useCallback((index: number) => {
    setCells((prev) => {
      if (!prev) return prev;
      const cell = prev[index];

      if (cell.kind === "flower") {
        const next = [...prev];
        next[index] = {
          kind: "flower",
          vitality: 1,
          pauseDecayUntil: performance.now() + REVITALIZE_PAUSE_MS,
        };
        queueMicrotask(() => {
          setPulseIndex(index);
          window.setTimeout(
            () => setPulseIndex((i) => (i === index ? null : i)),
            450
          );
        });
        return next;
      }

      if (cell.kind !== "bud") return prev;

      const next = [...prev];
      next[index] = newFlower();

      const emptySlots: number[] = [];
      for (let i = 0; i < next.length; i++) {
        if (next[i].kind === "empty") emptySlots.push(i);
      }
      const spawnAt = pickRandomIndex(emptySlots);
      if (spawnAt !== null) next[spawnAt] = { kind: "bud" };

      return next;
    });
  }, []);

  if (!cells) {
    return <div className="for-gma-root" aria-hidden />;
  }

  return (
    <div className="for-gma-root" role="presentation">
      <div className="for-gma-grid">
        {cells.map((cell, index) => (
          <button
            key={index}
            type="button"
            className={[
              "for-gma-cell",
              cell.kind === "bud" && "is-red",
              cell.kind === "flower" && "is-blue",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={cell.kind === "empty"}
            onClick={() => handleCellTap(index)}
            aria-label=""
          >
            {cell.kind === "bud" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="for-gma-cell-img"
                src={forGmaAssets.bud}
                alt=""
                draggable={false}
              />
            )}
            {cell.kind === "flower" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={[
                  "for-gma-cell-img",
                  pulseIndex === index && "is-pulse",
                ]
                  .filter(Boolean)
                  .join(" ")}
                src={forGmaAssets.flower}
                alt=""
                draggable={false}
                style={flowerVisuals(cell.vitality)}
              />
            )}
          </button>
        ))}
      </div>

      {/* Butterfly — preserved in ./butterfly.tsx, not triggered */}
      <ButterflyOverlay active={false} />
    </div>
  );
}
