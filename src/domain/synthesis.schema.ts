/**
 * Synthesis Schema - report structure with citations
 */
import { z } from "zod";
import { MediaItemSchema } from "./source.schema.js";

export const CitationSchema = z.object({
  id: z.string(), // [1], [2], etc.
  sourceId: z.string().uuid(),
  url: z.string().url(),
  title: z.string(),
  domain: z.string(),
  favicon: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const SectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(), // Markdown with [1], [2] citations
  summary: z.string().optional(),
  citationIds: z.array(z.string()), // Referenced citations
  media: z.array(MediaItemSchema).default([]),
  subsections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        citationIds: z.array(z.string()),
      }),
    )
    .default([]),
  order: z.number().int(),
});
export type Section = z.infer<typeof SectionSchema>;

export const KeyFindingSchema = z.object({
  id: z.string().uuid(),
  finding: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  citationIds: z.array(z.string()),
  category: z.string().optional(),
});
export type KeyFinding = z.infer<typeof KeyFindingSchema>;

export const ConflictSchema = z.object({
  id: z.string().uuid(),
  topic: z.string(),
  perspectives: z.array(
    z.object({
      viewpoint: z.string(),
      sourceIds: z.array(z.string().uuid()),
      citationIds: z.array(z.string()),
    }),
  ),
  significance: z.enum(["high", "medium", "low"]),
});
export type Conflict = z.infer<typeof ConflictSchema>;

export const SynthesisSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(KeyFindingSchema),
  sections: z.array(SectionSchema),
  conflicts: z.array(ConflictSchema).default([]),
  citations: z.array(CitationSchema),
  relatedQuestions: z.array(z.string()).default([]),
  generatedAt: z.coerce.date(),
});
export type Synthesis = z.infer<typeof SynthesisSchema>;
