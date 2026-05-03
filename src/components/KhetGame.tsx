"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Coord, Owner } from "@/lib/khet/types";
import { pieceLabel } from "@/lib/khet/pieces";
import { createClassicGrid } from "@/lib/khet/classicSetup";
import {
  applyMove,
  canRotatePiece,
  listMoveDestinations,
  rotatePieceCw,
} from "@/lib/khet/moves";
import { cloneGrid, getPiece } from "@/lib/khet/grid";
import { applyTraceResult, pathToSegments, traceLaser } from "@/lib/khet/laser";
import { makeMove, applyGameAction } from "@/lib/khet/ai";

const LASER_MS = 620;
const AI_DELAY_MS = 480;

function coordKey(c: Coord): string {
  return `${c.col},${c.row}`;
}

function sameCoord(a: Coord | null, b: Coord): boolean {
  return !!a && a.col === b.col && a.row === b.row;
}

function coordInList(list: Coord[], c: Coord): boolean {
  return list.some((x) => x.col === c.col && x.row === c.row);
}

export default function KhetGame() {
  const [grid, setGrid] = useState(() => createClassicGrid());
  const gridRef = useRef(grid);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const [currentPlayer, setCurrentPlayer] = useState<Owner>(1);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [selected, setSelected] = useState<Coord | null>(null);
  const [laserPath, setLaserPath] = useState<Coord[] | null>(null);
  const [busy, setBusy] = useState(false);

  const legalDestinations = useMemo(() => {
    if (!selected || winner !== null || busy || currentPlayer !== 1) return [];
    return listMoveDestinations(grid, selected, 1);
  }, [selected, grid, winner, busy, currentPlayer]);

  const runLaserThenAdvance = useCallback(
    (working: ReturnType<typeof cloneGrid>, firer: Owner) => {
      const trace = traceLaser(working, firer);
      setLaserPath(trace.path);
      setBusy(true);
      window.setTimeout(() => {
        const w = applyTraceResult(working, trace);
        setGrid(cloneGrid(working));
        setLaserPath(null);
        setBusy(false);
        if (w !== null) {
          setWinner(w);
          return;
        }
        setCurrentPlayer(firer === 1 ? 2 : 1);
      }, LASER_MS);
    },
    [],
  );

  const tryHumanMove = useCallback(
    (to: Coord) => {
      if (
        winner !== null ||
        busy ||
        currentPlayer !== 1 ||
        !selected ||
        !coordInList(legalDestinations, to)
      ) {
        return;
      }
      const g = cloneGrid(gridRef.current);
      applyMove(g, selected, to);
      setGrid(g);
      setSelected(null);
      runLaserThenAdvance(g, 1);
    },
    [
      winner,
      busy,
      currentPlayer,
      selected,
      legalDestinations,
      runLaserThenAdvance,
    ],
  );

  const tryHumanRotate = useCallback(() => {
    if (
      winner !== null ||
      busy ||
      currentPlayer !== 1 ||
      !selected ||
      !canRotatePiece(gridRef.current, selected, 1)
    ) {
      return;
    }
    const g = cloneGrid(gridRef.current);
    const p = getPiece(g, selected)!;
    g[selected.col][selected.row] = rotatePieceCw(p);
    setGrid(g);
    setSelected(null);
    runLaserThenAdvance(g, 1);
  }, [winner, busy, currentPlayer, selected, runLaserThenAdvance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        tryHumanRotate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryHumanRotate]);

  const aiEpoch = useRef(0);

  useEffect(() => {
    if (winner !== null || currentPlayer !== 2) return;
    aiEpoch.current += 1;
    const epoch = aiEpoch.current;
    const id = window.setTimeout(() => {
      if (epoch !== aiEpoch.current) return;
      const action = makeMove({
        grid: gridRef.current,
        currentPlayer: 2,
        winner: null,
      });
      if (!action) return;
      const g = cloneGrid(gridRef.current);
      applyGameAction(g, action);
      setGrid(g);
      runLaserThenAdvance(g, 2);
    }, AI_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [currentPlayer, winner, runLaserThenAdvance]);

  const onCellClick = (col: number, row: number) => {
    if (winner !== null || busy) return;
    const c: Coord = { col, row };
    const piece = getPiece(grid, c);

    if (currentPlayer === 1) {
      if (piece && piece.owner === 1) {
        setSelected(c);
        return;
      }
      if (selected && coordInList(legalDestinations, c)) {
        tryHumanMove(c);
        return;
      }
      setSelected(null);
    }
  };

  const reset = () => {
    setGrid(createClassicGrid());
    setCurrentPlayer(1);
    setWinner(null);
    setSelected(null);
    setLaserPath(null);
    setBusy(false);
  };

  const svgPoints = laserPath ? pathToSegments(laserPath) : [];

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-5xl mx-auto">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-100">
          Khet 2.0 — Laser Chess
        </h1>
        <p className="text-sm text-stone-400">
          Silver (you) moves first. Select a piece, click a highlighted square, or
          press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-xs">R</kbd>{" "}
          to rotate. Red AI replies after each turn.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        {winner === null ? (
          <p className="text-stone-300">
            Turn:{" "}
            <span
              className={
                currentPlayer === 1 ? "text-slate-200 font-medium" : "text-orange-400 font-medium"
              }
            >
              {currentPlayer === 1 ? "Silver (you)" : "Red (AI)"}
            </span>
            {busy && (
              <span className="ml-2 text-cyan-400/90"> — firing laser…</span>
            )}
          </p>
        ) : (
          <p className="text-lg font-medium text-amber-300">
            {winner === 1 ? "Silver wins!" : "Red wins!"}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-stone-600 bg-stone-800 px-3 py-1.5 text-stone-200 hover:bg-stone-700 transition text-sm"
        >
          New game
        </button>
      </div>

      <div className="relative w-full max-w-[min(100%,720px)] aspect-[10/8] select-none">
        <div
          className="absolute inset-0 grid grid-cols-10 grid-rows-8 gap-px bg-stone-950 p-px rounded-lg overflow-hidden border border-stone-700 shadow-xl"
          style={{ gridTemplateRows: "repeat(8, minmax(0, 1fr))" }}
        >
          {Array.from({ length: 80 }, (_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const piece = grid[col][row];
            const isDark = (col + row) % 2 === 0;
            const borderCol = col === 0 || col === 9;
            const isSel = sameCoord(selected, { col, row });
            const isLegal =
              selected &&
              currentPlayer === 1 &&
              coordInList(legalDestinations, { col, row });

            return (
              <button
                type="button"
                key={coordKey({ col, row })}
                className={[
                  "relative flex items-center justify-center min-h-0 transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80",
                  borderCol ? "bg-rose-950/55" : isDark ? "bg-stone-900" : "bg-stone-800",
                  isSel ? "ring-2 ring-amber-400 z-10" : "",
                  isLegal ? "ring-2 ring-emerald-500/90 ring-inset z-10" : "",
                ].join(" ")}
                onClick={() => onCellClick(col, row)}
                disabled={busy}
                aria-label={`Cell ${col},${row}`}
              >
                {piece && (
                  <span
                    className={[
                      "flex h-[85%] w-[85%] max-h-[52px] max-w-[52px] items-center justify-center rounded-full text-sm font-bold shadow-md border-2",
                      piece.owner === 1
                        ? "bg-slate-200 text-stone-900 border-slate-400"
                        : "bg-orange-700 text-orange-50 border-orange-500",
                    ].join(" ")}
                    style={{
                      transform: `rotate(${piece.orientation * 90}deg)`,
                    }}
                    title={`${piece.pieceType} o=${piece.orientation}`}
                  >
                    {pieceLabel(piece.pieceType)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {svgPoints.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-20 overflow-visible"
            viewBox="0 0 10 8"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="rgb(34,211,238)"
              strokeWidth="0.08"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.92}
              points={svgPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          </svg>
        )}
      </div>

      <footer className="text-xs text-stone-500 text-center max-w-lg">
        Coordinates (col, row) start at the top-left. Border columns 0 and 9 are
        restricted home columns (silver left, red right).
      </footer>
    </div>
  );
}
