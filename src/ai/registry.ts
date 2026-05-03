import type { AiEngineModule } from "./types";
import * as RandoAI from "./RandoAI";

/**
 * Register each engine module here when you add a new file under `src/ai/`.
 * The API lists filenames from disk for the dropdown; this map supplies runtime implementations.
 */
export const aiRegistry: Record<string, AiEngineModule> = {
  RandoAI,
};

export function getAiEngine(name: string): AiEngineModule | undefined {
  return aiRegistry[name];
}
