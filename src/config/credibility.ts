/**
 * Domain Credibility Configuration
 *
 * Credibility tiers, scoring, and JS-required domain detection.
 */
import { z } from "zod";

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
