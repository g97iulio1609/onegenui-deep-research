/**
 * Effort Level Schema - defines research intensity levels
 * Standard: ~3min, Deep: ~10min, Max: ~30min
 */
import { z } from "zod";

export const EffortLevelSchema = z.enum(["standard", "deep", "max"]);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

export const EffortConfigSchema = z.object({
  level: EffortLevelSchema,
  maxSteps: z.number().min(20).max(400),
  timeoutMs: z.number().min(120_000).max(3_800_000), // 2min - ~63min
  maxSources: z.number().min(10).max(200),
  parallelism: z.number().min(5).max(30),
  recursionDepth: z.number().min(1).max(4),
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
    maxSteps: 80,
    timeoutMs: 420_000, // 7 min
    maxSources: 40,
    parallelism: 15,
    recursionDepth: 1,
    enableAuth: false,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.75,
  },
  deep: {
    level: "deep",
    maxSteps: 150,
    timeoutMs: 1_200_000, // 20 min
    maxSources: 75,
    parallelism: 20,
    recursionDepth: 2,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.8,
  },
  max: {
    level: "max",
    maxSteps: 300,
    timeoutMs: 3_600_000, // 60 min
    maxSources: 100,
    parallelism: 25,
    recursionDepth: 3,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.9,
  },
};
