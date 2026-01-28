/**
 * Research Query Schema - decomposed query structure
 */
import { z } from "zod";
import { EffortConfigSchema } from "./effort-level.schema.js";

export const SearchStrategySchema = z.enum([
  "broad", // Cast wide net
  "academic", // Focus on papers/research
  "news", // Recent news coverage
  "technical", // Code, docs, specs
  "social", // Discussions, opinions
  "official", // Government, official sources
]);
export type SearchStrategy = z.infer<typeof SearchStrategySchema>;

export const SubQuerySchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  purpose: z.string(), // Why this sub-query
  strategy: SearchStrategySchema,
  priority: z.number().min(1).max(10),
  parentId: z.string().uuid().optional(), // For recursive queries
  depth: z.number().int().min(0).max(3),
});
export type SubQuery = z.infer<typeof SubQuerySchema>;

export const ResearchQuerySchema = z.object({
  id: z.string().uuid(),
  originalQuery: z.string(),
  refinedQuery: z.string().optional(),
  mainTopics: z.array(z.string()),
  subQueries: z.array(SubQuerySchema),
  temporalFocus: z
    .enum(["recent", "historical", "all", "specific"])
    .default("all"),
  temporalRange: z
    .object({
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
    })
    .optional(),
  geographicFocus: z.string().optional(),
  language: z.string().default("en"),
  effort: EffortConfigSchema,
  context: z.string().optional(), // User-provided context
  createdAt: z.coerce.date(),
});
export type ResearchQuery = z.infer<typeof ResearchQuerySchema>;
