/**
 * Effort Level Schema - defines research intensity levels
 * Standard: ~3min, Deep: ~10min, Max: ~30min
 */
import { z } from "zod";

export const EffortLevelSchema = z.enum(["standard", "deep", "max"]);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

export const EffortConfigSchema = z.object({
  level: EffortLevelSchema,
  maxSteps: z.number().min(20).max(200),
  timeoutMs: z.number().min(120_000).max(2_700_000), // 2min - 45min
  maxSources: z.number().min(10).max(100),
  parallelism: z.number().min(5).max(20),
  recursionDepth: z.number().min(1).max(3),
  enableAuth: z.boolean(),
  enableVisualizations: z.boolean(),
  autoStopOnQuality: z.boolean(),
  qualityThreshold: z.number().min(0.7).max(1),
});
export type EffortConfig = z.infer<typeof EffortConfigSchema>;

/** Default configurations per effort level */
export const EFFORT_PRESETS: Record<EffortLevel, EffortConfig> = {
  standard: {
    level: "standard",
    maxSteps: 50,
    timeoutMs: 300_000, // 5 min
    maxSources: 25,
    parallelism: 10,
    recursionDepth: 1,
    enableAuth: false,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.75,
  },
  deep: {
    level: "deep",
    maxSteps: 100,
    timeoutMs: 900_000, // 15 min
    maxSources: 50,
    parallelism: 15,
    recursionDepth: 2,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.8,
  },
  max: {
    level: "max",
    maxSteps: 200,
    timeoutMs: 2_700_000, // 45 min
    maxSources: 100,
    parallelism: 20,
    recursionDepth: 3,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.9,
  },
};
