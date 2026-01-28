/**
 * Research Result Schema - complete output
 */
import { z } from "zod";
import { ResearchQuerySchema } from "./research-query.schema.js";
import { SourceSchema } from "./source.schema.js";
import { SynthesisSchema } from "./synthesis.schema.js";
import {
  KnowledgeGraphSchema,
  MindMapSchema,
} from "./knowledge-graph.schema.js";

export const ResearchStatusSchema = z.enum([
  "pending",
  "decomposing", // Query decomposition
  "searching", // Parallel search
  "ranking", // Source ranking
  "extracting", // Content extraction
  "analyzing", // Content analysis
  "synthesizing", // Report generation
  "visualizing", // Graph/chart generation
  "completed",
  "failed",
  "stopped", // User cancelled
]);
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;

export const ResearchStatsSchema = z.object({
  totalSources: z.number().int(),
  sourcesProcessed: z.number().int(),
  stepsCompleted: z.number().int(),
  totalSteps: z.number().int(),
  searchQueries: z.number().int(),
  pagesExtracted: z.number().int(),
  tokensUsed: z.number().int().optional(),
  durationMs: z.number().int(),
});
export type ResearchStats = z.infer<typeof ResearchStatsSchema>;

export const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  accuracy: z.number().min(0).max(1),
  depth: z.number().min(0).max(1),
  diversity: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  isSOTA: z.boolean(),
});
export type QualityScore = z.infer<typeof QualityScoreSchema>;

export const ChartConfigSchema = z.object({
  type: z.enum(["bar", "line", "area", "pie", "scatter"]),
  title: z.string(),
  data: z.array(z.record(z.union([z.string(), z.number()]))),
  xKey: z.string(),
  yKeys: z.array(z.string()),
  description: z.string().optional(),
});
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

export const TimelineEventSchema = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  title: z.string(),
  description: z.string().optional(),
  sourceIds: z.array(z.string().uuid()),
  importance: z.enum(["high", "medium", "low"]),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const ResearchResultSchema = z.object({
  id: z.string().uuid(),
  query: ResearchQuerySchema,
  status: ResearchStatusSchema,
  progress: z.number().min(0).max(1),
  currentPhase: z.string(),
  sources: z.array(SourceSchema),
  synthesis: SynthesisSchema.optional(),
  knowledgeGraph: KnowledgeGraphSchema.optional(),
  mindMap: MindMapSchema.optional(),
  charts: z.array(ChartConfigSchema).default([]),
  timeline: z.array(TimelineEventSchema).default([]),
  quality: QualityScoreSchema.optional(),
  stats: ResearchStatsSchema,
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  error: z.string().optional(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;
