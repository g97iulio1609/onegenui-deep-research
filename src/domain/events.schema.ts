/**
 * Research Events - streaming events for progress tracking
 */
import { z } from "zod";
import { ResearchStatusSchema } from "./research-result.schema.js";
import { SourceSchema } from "./source.schema.js";

export const BaseEventSchema = z.object({
  timestamp: z.coerce.date(),
  researchId: z.string().uuid(),
});

export const PhaseStartedEventSchema = BaseEventSchema.extend({
  type: z.literal("phase-started"),
  phase: ResearchStatusSchema,
  message: z.string(),
});

export const PhaseCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal("phase-completed"),
  phase: ResearchStatusSchema,
  durationMs: z.number(),
});

export const StepStartedEventSchema = BaseEventSchema.extend({
  type: z.literal("step-started"),
  stepId: z.string(),
  stepType: z.string(),
  description: z.string(),
  parallelGroup: z.number().optional(), // For parallel steps
});

export const StepCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal("step-completed"),
  stepId: z.string(),
  success: z.boolean(),
  durationMs: z.number(),
  resultSummary: z.string().optional(),
});

export const SourceFoundEventSchema = BaseEventSchema.extend({
  type: z.literal("source-found"),
  source: SourceSchema.pick({
    id: true,
    url: true,
    title: true,
    domain: true,
    sourceType: true,
  }),
});

export const SourceExtractedEventSchema = BaseEventSchema.extend({
  type: z.literal("source-extracted"),
  sourceId: z.string().uuid(),
  wordCount: z.number(),
  mediaCount: z.number(),
});

export const FindingDiscoveredEventSchema = BaseEventSchema.extend({
  type: z.literal("finding-discovered"),
  finding: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceIds: z.array(z.string().uuid()),
});

export const ProgressUpdateEventSchema = BaseEventSchema.extend({
  type: z.literal("progress-update"),
  progress: z.number().min(0).max(1),
  message: z.string(),
  stats: z.object({
    sourcesFound: z.number(),
    sourcesProcessed: z.number(),
    stepsCompleted: z.number(),
    totalSteps: z.number(),
  }),
});

export const QualityCheckEventSchema = BaseEventSchema.extend({
  type: z.literal("quality-check"),
  score: z.number().min(0).max(1),
  isSOTA: z.boolean(),
  shouldStop: z.boolean(),
  reason: z.string().optional(),
});

export const ErrorEventSchema = BaseEventSchema.extend({
  type: z.literal("error"),
  error: z.string(),
  recoverable: z.boolean(),
  stepId: z.string().optional(),
});

export const CompletedEventSchema = BaseEventSchema.extend({
  type: z.literal("completed"),
  totalDurationMs: z.number(),
  finalQuality: z.number(),
});

export const ResearchEventSchema = z.discriminatedUnion("type", [
  PhaseStartedEventSchema,
  PhaseCompletedEventSchema,
  StepStartedEventSchema,
  StepCompletedEventSchema,
  SourceFoundEventSchema,
  SourceExtractedEventSchema,
  FindingDiscoveredEventSchema,
  ProgressUpdateEventSchema,
  QualityCheckEventSchema,
  ErrorEventSchema,
  CompletedEventSchema,
]);
export type ResearchEvent = z.infer<typeof ResearchEventSchema>;

// Type helpers for specific events
export type PhaseStartedEvent = z.infer<typeof PhaseStartedEventSchema>;
export type StepStartedEvent = z.infer<typeof StepStartedEventSchema>;
export type ProgressUpdateEvent = z.infer<typeof ProgressUpdateEventSchema>;
export type QualityCheckEvent = z.infer<typeof QualityCheckEventSchema>;
