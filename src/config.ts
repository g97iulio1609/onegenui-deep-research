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
  weight: number; // Percentage weight for progress calculation (0-100)
  icon: string; // Icon identifier for UI
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
// Domain Credibility Scores
// ─────────────────────────────────────────────────────────────────────────────

export const CredibilityTierSchema = z.enum([
  "academic",
  "government",
  "major-news",
  "technical",
  "general",
]);
export type CredibilityTier = z.infer<typeof CredibilityTierSchema>;

export interface CredibilityConfig {
  domains: string[];
  score: number;
}

export const CREDIBILITY_TIERS: Record<CredibilityTier, CredibilityConfig> = {
  academic: {
    domains: [
      "nature.com",
      "science.org",
      "springer.com",
      "wiley.com",
      "arxiv.org",
      "pubmed.ncbi.nlm.nih.gov",
      "semanticscholar.org",
      "ieee.org",
      "acm.org",
      "jstor.org",
    ],
    score: 0.95,
  },
  government: {
    domains: [".gov", ".edu", "who.int", "europa.eu", "un.org"],
    score: 0.9,
  },
  "major-news": {
    domains: [
      "reuters.com",
      "apnews.com",
      "bbc.com",
      "bbc.co.uk",
      "nytimes.com",
      "washingtonpost.com",
      "theguardian.com",
      "economist.com",
      "ft.com",
      "wsj.com",
    ],
    score: 0.8,
  },
  technical: {
    domains: [
      "github.com",
      "stackoverflow.com",
      "developer.mozilla.org",
      "docs.microsoft.com",
      "cloud.google.com",
      "aws.amazon.com",
    ],
    score: 0.8,
  },
  general: {
    domains: [],
    score: 0.5,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// JS-Required Domains (need browser for extraction)
// ─────────────────────────────────────────────────────────────────────────────

export const JS_REQUIRED_DOMAINS: readonly string[] = [
  "twitter.com",
  "x.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com",
] as const;

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
  cacheTtlMs: 1800000, // 30 min
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
  cacheTtlMs: 300000, // 5 min
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

/**
 * Get credibility score for a domain
 */
export function getDomainCredibility(domain: string): number {
  const lowerDomain = domain.toLowerCase();

  for (const [, config] of Object.entries(CREDIBILITY_TIERS)) {
    for (const pattern of config.domains) {
      if (pattern.startsWith(".")) {
        if (lowerDomain.endsWith(pattern)) return config.score;
      } else {
        if (lowerDomain.includes(pattern)) return config.score;
      }
    }
  }

  return CREDIBILITY_TIERS.general.score;
}

/**
 * Check if a domain requires JavaScript for content extraction
 */
export function requiresJavaScript(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  return JS_REQUIRED_DOMAINS.some((d) => lowerDomain.includes(d));
}

// Re-export for convenience
export {
  EffortLevelSchema,
  EFFORT_PRESETS,
  type EffortLevel,
  type EffortConfig,
};
