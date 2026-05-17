"use client";

/**
 * Butterfly overlay — preserved for later. Not mounted by the game page.
 * Set ENABLE_BUTTERFLY to true and render <ButterflyOverlay /> when ready.
 */
import { useEffect, useState } from "react";
import { forGmaAssets } from "./assets";

export const ENABLE_BUTTERFLY = true;

const BUTTERFLY_DRIFT_MS = 6000;
const BUTTERFLY_FLAP_MS = 150;

type Butterfly = {
  startY: number;
};

function createButterfly(): Butterfly {
  return { startY: 20 + Math.random() * 60 };
}

export function ButterflyOverlay({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete?: () => void;
}) {
  const [butterfly, setButterfly] = useState<Butterfly | null>(null);
  const [progress, setProgress] = useState(0);
  const [wing, setWing] = useState(0);

  useEffect(() => {
    if (!active) {
      setButterfly(null);
      setProgress(0);
      setWing(0);
      return;
    }
    setButterfly(createButterfly());
    setProgress(0);
  }, [active]);

  useEffect(() => {
    if (!active || !butterfly) return;

    let raf = 0;
    let finished = false;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / BUTTERFLY_DRIFT_MS);
      setProgress(t);
      if (t >= 1) {
        if (!finished) {
          finished = true;
          onComplete?.();
        }
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, butterfly, onComplete]);

  useEffect(() => {
    if (!active || !butterfly) return;

    const flap = setInterval(() => {
      setWing((w) => (w === 0 ? 1 : 0));
    }, BUTTERFLY_FLAP_MS);

    return () => clearInterval(flap);
  }, [active, butterfly]);

  if (!ENABLE_BUTTERFLY || !active || !butterfly) return null;

  const top =
    butterfly.startY + Math.sin(progress * Math.PI * 2) * 4;
  const src =
    wing === 0 ? forGmaAssets.butterflyA : forGmaAssets.butterflyB;

  return (
    <div
      className="for-gma-butterfly"
      style={{
        left: `${-12 + progress * 124}%`,
        top: `${top}%`,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} />
    </div>
  );
}
