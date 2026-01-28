/**
 * Source Ranker Port - intelligent source ranking
 */
import type {
  Source,
  RankedSource,
  SourceType,
} from "../domain/source.schema.js";

export interface RankingCriteria {
  query: string;
  topics: string[];
  preferRecent: boolean;
  preferredTypes?: SourceType[];
  excludedDomains?: string[];
}

export interface RankingWeights {
  credibility: number; // Domain reputation
  relevance: number; // Query match
  recency: number; // Publication date
  diversity: number; // Source variety bonus
  depth: number; // Content richness
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  credibility: 0.25,
  relevance: 0.35,
  recency: 0.15,
  diversity: 0.1,
  depth: 0.15,
};

/**
 * Port for source ranking and selection
 */
export interface SourceRankerPort {
  /** Rank sources by quality and relevance */
  rank(sources: Source[], criteria: RankingCriteria): Promise<RankedSource[]>;

  /** Filter sources by minimum credibility */
  filterByCredibility(sources: Source[], minScore: number): Source[];

  /** Diversify sources to avoid clustering from same domain */
  diversify(sources: Source[], maxPerDomain: number): Source[];

  /** Get credibility score for a domain */
  getCredibilityScore(domain: string): number;

  /** Update ranking weights */
  setWeights(weights: Partial<RankingWeights>): void;
}
