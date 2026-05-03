"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GameBoard, movesEqual } from "@/lib/gameboard";
import type { Move, MoveAction } from "@/lib/moves";
import {
  applyLaserResult,
  pathToSegments,
  traceLaser,
} from "@/lib/laser";
import type { Orientation, Owner, Piece, Position } from "@/lib/piece";
import { getAiEngine } from "@/ai/registry";
import { PieceGlyph } from "@/components/PieceGlyph";

const LASER_MS = 620;
const AI_DELAY_MS = 480;

function coordKey(c: Position): string {
  return `${c.col},${c.row}`;
}

function samePos(a: Position | null, b: Position): boolean {
  return !!a && a.col === b.col && a.row === b.row;
}

function actionTarget(action: MoveAction): Position | null {
  if (action.type === "move" || action.type === "swap") return action.to;
  return null;
}

export default function KhetGame() {
  const [board, setBoard] = useState(() => GameBoard.classic());
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const [currentPlayer, setCurrentPlayer] = useState<Owner>(1);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [selected, setSelected] = useState<Position | null>(null);
  const [stagedMove, setStagedMove] = useState<Move | null>(null);
  const [laserPath, setLaserPath] = useState<Position[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [engineIds, setEngineIds] = useState<string[]>([]);
  const [selectedAi, setSelectedAi] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-engines")
      .then((r) => r.json())
      .then((d: { engines: string[] }) => {
        if (cancelled) return;
        const list = d.engines ?? [];
        setEngineIds(list);
        const playable = list.filter((id) => getAiEngine(id));
        setSelectedAi((prev) =>
          playable.includes(prev) ? prev : playable[0] ?? "",
        );
      })
      .catch(() => {
        if (!cancelled) setEngineIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const legalTargetsForSelected = useMemo(() => {
    if (!selected || winner !== null || busy || currentPlayer !== 1) return [];
    return board
      .getLegalMoves(1)
      .filter((m) => samePos(m.from, selected))
      .filter(
        (m) =>
          m.action.type === "move" ||
          m.action.type === "swap",
      )
      .map((m) => actionTarget(m.action)!);
  }, [selected, board, winner, busy, currentPlayer]);

  const canSubmit =
    currentPlayer === 1 &&
    winner === null &&
    !busy &&
    stagedMove !== null &&
    board.getLegalMoves(1).some((m) => movesEqual(m, stagedMove));

  const runLaserThenAdvance = useCallback((working: GameBoard, firer: Owner) => {
    const result = traceLaser(working, firer);
    setLaserPath(result.path);
    setBusy(true);
    window.setTimeout(() => {
      let win: Owner | null = null;
      if (result.hit === "pharaoh" && result.hitPosition) {
        const ph = working.getPiece(result.hitPosition);
        if (ph?.pieceType === "pharaoh") {
          win = ph.owner === 1 ? 2 : 1;
        }
      }
      applyLaserResult(working, result);
      setBoard(working.clone());
      setLaserPath(null);
      setBusy(false);
      if (win !== null) {
        setWinner(win);
        return;
      }
      setCurrentPlayer(firer === 1 ? 2 : 1);
    }, LASER_MS);
  }, []);

  const commitHumanTurn = useCallback(() => {
    if (!canSubmit || !stagedMove) return;
    const next = boardRef.current.clone();
    if (!next.makeMove(stagedMove)) return;
    console.log("[khet] commit move", stagedMove);
    setBoard(next);
    setStagedMove(null);
    setSelected(null);
    runLaserThenAdvance(next, 1);
  }, [canSubmit, stagedMove, runLaserThenAdvance]);

  const stageRotateCw = useCallback(() => {
    if (
      winner !== null ||
      busy ||
      currentPlayer !== 1 ||
      !selected
    ) {
      return;
    }
    const candidate: Move = {
      from: { ...selected },
      action: { type: "rotate", direction: 1 },
    };
    if (!board.getLegalMoves(1).some((m) => movesEqual(m, candidate))) {
      return;
    }
    setStagedMove(candidate);
    console.log("[khet] stage rotate (CW)", candidate);
  }, [winner, busy, currentPlayer, selected, board]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        stageRotateCw();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stageRotateCw]);

  const aiEpoch = useRef(0);

  useEffect(() => {
    if (winner !== null || currentPlayer !== 2) return;
    aiEpoch.current += 1;
    const epoch = aiEpoch.current;
    const id = window.setTimeout(() => {
      if (epoch !== aiEpoch.current) return;
      const engine = selectedAi ? getAiEngine(selectedAi) : undefined;
      if (!engine) return;
      const m = engine.makeMove(boardRef.current);
      if (!m) return;
      console.log("[khet] AI chosen move", m);
      const next = boardRef.current.clone();
      if (!next.makeMove(m)) return;
      setBoard(next);
      runLaserThenAdvance(next, 2);
    }, AI_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [currentPlayer, winner, runLaserThenAdvance, selectedAi]);

  const pickMoveToSquare = (to: Position): Move | null => {
    if (!selected) return null;
    const legal = board.getLegalMoves(1);
    const found = legal.find(
      (m) =>
        samePos(m.from, selected) &&
        (m.action.type === "move" || m.action.type === "swap") &&
        actionTarget(m.action) &&
        samePos(actionTarget(m.action)!, to),
    );
    return found ?? null;
  };

  const onCellClick = (col: number, row: number) => {
    if (winner !== null || busy) return;
    const c: Position = { col, row };
    const piece = board.getPiece(c);

    if (currentPlayer === 1) {
      if (piece && piece.owner === 1) {
        setSelected(c);
        setStagedMove(null);
        console.log("[khet] select piece start", c);
        return;
      }
      if (selected) {
        const mv = pickMoveToSquare(c);
        if (mv) {
          setStagedMove(mv);
          console.log("[khet] stage move/swap", mv);
          return;
        }
      }
      setSelected(null);
      setStagedMove(null);
    }
  };

  const reset = () => {
    setBoard(GameBoard.classic());
    setCurrentPlayer(1);
    setWinner(null);
    setSelected(null);
    setStagedMove(null);
    setLaserPath(null);
    setBusy(false);
    console.log("[khet] new game");
  };

  const svgPoints = laserPath ? pathToSegments(laserPath) : [];

  const displayOrientation = (
    col: number,
    row: number,
    piece: Piece,
  ): Orientation => {
    if (
      stagedMove?.action.type === "rotate" &&
      samePos(stagedMove.from, { col, row })
    ) {
      return ((((piece.orientation as number) + 1) % 4) + 4) % 4 as Orientation;
    }
    return piece.orientation;
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-5xl mx-auto">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-100">
          Khet 2.0 — Laser Chess
        </h1>
        <p className="text-sm text-stone-400">
          Silver (you): select a piece (light blue outline), choose a destination or press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-xs">
            R
          </kbd>{" "}
          to stage rotation. Press <strong className="text-stone-300">Commit move</strong> to apply and fire the laser.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-stone-400">
          <span className="whitespace-nowrap">Red AI</span>
          <select
            className="rounded-md border border-stone-600 bg-stone-900 px-2 py-1.5 text-stone-200 text-sm min-w-[10rem]"
            value={selectedAi}
            onChange={(e) => setSelectedAi(e.target.value)}
            disabled={busy || engineIds.length === 0}
            aria-label="Select AI engine"
          >
            {engineIds.length === 0 ? (
              <option value="">Loading…</option>
            ) : (
              engineIds.map((id) => {
                const ok = !!getAiEngine(id);
                return (
                  <option key={id} value={id} disabled={!ok}>
                    {ok ? id : `${id} (register in registry.ts)`}
                  </option>
                );
              })
            )}
          </select>
        </label>
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
              <span className="ml-2 text-red-400/90"> — firing laser…</span>
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

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={commitHumanTurn}
          disabled={!canSubmit}
          className={[
            "rounded-lg px-5 py-2 text-sm font-medium transition border",
            canSubmit
              ? "bg-emerald-800 border-emerald-600 text-emerald-50 hover:bg-emerald-700"
              : "bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed",
          ].join(" ")}
        >
          Commit move
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
            const piece = board.getPiece({ col, row });
            const isDark = (col + row) % 2 === 0;
            const borderCol = col === 0 || col === 9;
            const isSelectStart =
              selected &&
              currentPlayer === 1 &&
              samePos(selected, { col, row });
            const isLegal =
              selected &&
              currentPlayer === 1 &&
              legalTargetsForSelected.some((t) => t.col === col && t.row === row);
            const isStagedFrom =
              stagedMove &&
              (stagedMove.action.type === "move" ||
                stagedMove.action.type === "swap") &&
              samePos(stagedMove.from, { col, row });
            const isStagedTo =
              stagedMove &&
              (stagedMove.action.type === "move" ||
                stagedMove.action.type === "swap") &&
              actionTarget(stagedMove.action) &&
              samePos(actionTarget(stagedMove.action)!, { col, row });
            const isStagedRotate =
              stagedMove?.action.type === "rotate" &&
              samePos(stagedMove.from, { col, row });

            return (
              <button
                type="button"
                key={coordKey({ col, row })}
                className={[
                  "relative flex items-center justify-center min-h-0 transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80",
                  borderCol ? "bg-rose-950/55" : isDark ? "bg-stone-900" : "bg-stone-800",
                  isSelectStart ? "ring-2 ring-sky-400 z-10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]" : "",
                  isLegal ? "ring-2 ring-emerald-500/90 ring-inset z-10" : "",
                  isStagedFrom ? "ring-2 ring-sky-400/90 z-10" : "",
                  isStagedTo ? "ring-2 ring-sky-300 z-10 ring-offset-1 ring-offset-stone-900" : "",
                  isStagedRotate ? "ring-2 ring-violet-400 z-10" : "",
                ].join(" ")}
                onClick={() => onCellClick(col, row)}
                disabled={busy}
                aria-label={`Cell ${col},${row}`}
              >
                {piece && (
                  <PieceGlyph
                    pieceType={piece.pieceType}
                    owner={piece.owner}
                    orientation={displayOrientation(col, row, piece)}
                  />
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
              stroke="#dc2626"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 5 }}
              points={svgPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          </svg>
        )}
      </div>

      <footer className="text-xs text-stone-500 text-center max-w-lg">
        Coordinates (col, row) start at the top-left. Columns 0 and 9 are restricted home columns.
      </footer>
    </div>
  );
}
