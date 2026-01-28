/**
 * Source Schema - represents a research source with scoring
 */
import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "academic",
  "news",
  "social",
  "technical",
  "official",
  "general",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const MediaItemSchema = z.object({
  type: z.enum(["image", "video", "audio", "document"]),
  url: z.string().url(),
  title: z.string().optional(),
  thumbnail: z.string().url().optional(),
  duration: z.number().optional(), // seconds for video/audio
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MediaItem = z.infer<typeof MediaItemSchema>;

export const SourceSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string(),
  snippet: z.string().optional(),
  content: z.string().optional(),
  domain: z.string(),
  favicon: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  author: z.string().optional(),
  sourceType: SourceTypeSchema,
  credibilityScore: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  finalScore: z.number().min(0).max(1).optional(),
  media: z.array(MediaItemSchema).default([]),
  requiresAuth: z.boolean().default(false),
  authProvider: z.string().optional(),
  extractedAt: z.coerce.date().optional(),
  wordCount: z.number().optional(),
  language: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const RankedSourceSchema = SourceSchema.extend({
  rank: z.number().int().positive(),
  finalScore: z.number().min(0).max(1),
});
export type RankedSource = z.infer<typeof RankedSourceSchema>;
