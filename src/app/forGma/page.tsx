"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { forGmaAssets } from "./assets";
import { ButterflyOverlay } from "./butterfly";

const GRID = 5;
const RED_COUNT = 5;
const CELL_COUNT = GRID * GRID;

type CellState = "empty" | "red" | "blue";

function pickRedIndices(): number[] {
  const indices = new Set<number>();
  while (indices.size < RED_COUNT) {
    indices.add(Math.floor(Math.random() * CELL_COUNT));
  }
  return Array.from(indices);
}

function buildInitialCells(): CellState[] {
  const cells: CellState[] = Array(CELL_COUNT).fill("empty");
  for (const i of pickRedIndices()) {
    cells[i] = "red";
  }
  return cells;
}

export default function ForGmaPage() {
  const [cells, setCells] = useState<CellState[] | null>(null);

  useEffect(() => {
    setCells(buildInitialCells());
  }, []);

  const redsRemaining = useMemo(
    () => (cells ? cells.filter((s) => s === "red").length : 0),
    [cells]
  );

  useEffect(() => {
    if (!cells || redsRemaining !== 0) return;
    setCells(buildInitialCells());
  }, [cells, redsRemaining]);

  const handleCellTap = useCallback((index: number) => {
    setCells((prev) => {
      if (!prev || prev[index] !== "red") return prev;
      const next = [...prev];
      next[index] = "blue";
      return next;
    });
  }, []);

  if (!cells) {
    return <div className="for-gma-root" aria-hidden />;
  }

  return (
    <div className="for-gma-root" role="presentation">
      <div className="for-gma-grid">
        {cells.map((state, index) => (
          <button
            key={index}
            type="button"
            className={[
              "for-gma-cell",
              state === "red" && "is-red",
              state === "blue" && "is-blue",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={state !== "red"}
            onClick={() => handleCellTap(index)}
            aria-label=""
          >
            {state === "red" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="for-gma-cell-img"
                src={forGmaAssets.bud}
                alt=""
                draggable={false}
              />
            )}
            {state === "blue" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="for-gma-cell-img"
                src={forGmaAssets.flower}
                alt=""
                draggable={false}
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
