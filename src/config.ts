/**
 * Deep Research Configuration - Single Source of Truth
 *
 * Centralizes all configurable values to eliminate duplication
 * and enable future configuration from external sources.
 */
import { z } from "zod";
import {
  EffortLevelSchema,
  EFFORT_PRESETS,
  type EffortLevel,
  type EffortConfig,
} from "./domain/effort-level.schema";

// Re-export credibility module for backward compatibility
export {
  CredibilityTierSchema,
  type CredibilityTier,
  type CredibilityConfig,
  CREDIBILITY_TIERS,
  getDomainCredibility,
  JS_REQUIRED_DOMAINS,
  requiresJavaScript,
} from "./config/credibility.js";

// ─────────────────────────────────────────────────────────────────────────────
// Research Phases
// ─────────────────────────────────────────────────────────────────────────────

export const ResearchPhaseSchema = z.enum([
  "query-decomposition",
  "source-discovery",
  "content-extraction",
  "analysis",
  "synthesis",
  "visualization",
]);
export type ResearchPhase = z.infer<typeof ResearchPhaseSchema>;

export interface PhaseConfig {
  id: ResearchPhase;
  label: string;
  weight: number;
  icon: string;
}

export const RESEARCH_PHASES: readonly PhaseConfig[] = [
  {
    id: "query-decomposition",
    label: "Query Decomposition",
    weight: 5,
    icon: "split",
  },
  {
    id: "source-discovery",
    label: "Source Discovery",
    weight: 25,
    icon: "search",
  },
  {
    id: "content-extraction",
    label: "Content Extraction",
    weight: 30,
    icon: "file-text",
  },
  { id: "analysis", label: "Analysis", weight: 20, icon: "brain" },
  { id: "synthesis", label: "Synthesis", weight: 15, icon: "layers" },
  { id: "visualization", label: "Visualization", weight: 5, icon: "chart" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Timing Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface TimingConfig {
  estimatedMinutes: number;
  displayLabel: string;
}

export const EFFORT_TIMING: Record<EffortLevel, TimingConfig> = {
  standard: { estimatedMinutes: 3, displayLabel: "~3 min" },
  deep: { estimatedMinutes: 10, displayLabel: "~10 min" },
  max: { estimatedMinutes: 30, displayLabel: "~30 min" },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Quality Scoring Weights
// ─────────────────────────────────────────────────────────────────────────────

export const QualityScoringWeightsSchema = z.object({
  completeness: z.number().min(0).max(1),
  depth: z.number().min(0).max(1),
  diversity: z.number().min(0).max(1),
});
export type QualityScoringWeights = z.infer<typeof QualityScoringWeightsSchema>;

export const DEFAULT_SCORING_WEIGHTS: QualityScoringWeights = {
  completeness: 0.3,
  depth: 0.4,
  diversity: 0.3,
};

// ─────────────────────────────────────────────────────────────────────────────
// Scraping Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const ScrapingConfigSchema = z.object({
  maxConcurrent: z.number().min(1).max(30),
  timeoutMs: z.number().min(5000).max(60000),
  maxContentLength: z.number().min(1000).max(500000),
  cacheTtlMs: z.number().min(60000).max(3600000),
  maxPerDomain: z.number().min(1).max(15),
});
export type ScrapingConfig = z.infer<typeof ScrapingConfigSchema>;

export const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  maxConcurrent: 15,
  timeoutMs: 20000,
  maxContentLength: 150000,
  cacheTtlMs: 1800000,
  maxPerDomain: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Search Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const SearchConfigSchema = z.object({
  maxResultsPerQuery: z.number().min(5).max(100),
  cacheTtlMs: z.number().min(60000).max(600000),
  retryAttempts: z.number().min(1).max(5),
  retryDelayMs: z.number().min(500).max(5000),
});
export type SearchConfig = z.infer<typeof SearchConfigSchema>;

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxResultsPerQuery: 30,
  cacheTtlMs: 300000,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Access
// ─────────────────────────────────────────────────────────────────────────────

export interface ResearchConfig {
  effort: EffortConfig;
  timing: TimingConfig;
  phases: readonly PhaseConfig[];
  scoring: QualityScoringWeights;
  scraping: ScrapingConfig;
  search: SearchConfig;
}

/**
 * Get complete configuration for an effort level
 */
export function getResearchConfig(level: EffortLevel): ResearchConfig {
  return {
    effort: EFFORT_PRESETS[level],
    timing: EFFORT_TIMING[level],
    phases: RESEARCH_PHASES,
    scoring: DEFAULT_SCORING_WEIGHTS,
    scraping: DEFAULT_SCRAPING_CONFIG,
    search: DEFAULT_SEARCH_CONFIG,
  };
}

// Re-export for convenience
export {
  EffortLevelSchema,
  EFFORT_PRESETS,
  type EffortLevel,
  type EffortConfig,
};
