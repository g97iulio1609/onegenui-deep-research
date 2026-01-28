/**
 * Source Ranker Adapter - intelligent ranking implementation
 */
import type {
  SourceRankerPort,
  RankingCriteria,
  RankingWeights,
} from "../ports/source-ranker.port.js";
import type { Source, RankedSource } from "../domain/source.schema.js";
import { getDomainCredibility } from "../config.js";

/** Default ranking weights */
const DEFAULT_WEIGHTS: RankingWeights = {
  credibility: 0.25,
  relevance: 0.35,
  recency: 0.15,
  diversity: 0.1,
  depth: 0.15,
};

export class SourceRankerAdapter implements SourceRankerPort {
  private weights: RankingWeights;

  constructor(weights?: Partial<RankingWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  async rank(
    sources: Source[],
    criteria: RankingCriteria,
  ): Promise<RankedSource[]> {
    const seenDomains = new Map<string, number>();

    const scored = sources.map((source) => {
      const credibility = this.getCredibilityScore(source.domain);
      const relevance = this.calculateRelevance(source, criteria);
      const recency = this.calculateRecency(source.publishedAt);
      const depth = this.calculateDepth(source);

      // Diversity penalty for same domain
      const domainCount = seenDomains.get(source.domain) || 0;
      seenDomains.set(source.domain, domainCount + 1);
      const diversity = Math.max(0, 1 - domainCount * 0.3);

      const finalScore =
        credibility * this.weights.credibility +
        relevance * this.weights.relevance +
        recency * this.weights.recency +
        diversity * this.weights.diversity +
        depth * this.weights.depth;

      return { source, finalScore };
    });

    // Sort by score descending
    scored.sort((a, b) => b.finalScore - a.finalScore);

    // Apply type preference boost
    if (criteria.preferredTypes?.length) {
      scored.sort((a, b) => {
        const aPreferred = criteria.preferredTypes!.includes(
          a.source.sourceType,
        );
        const bPreferred = criteria.preferredTypes!.includes(
          b.source.sourceType,
        );
        if (aPreferred && !bPreferred) return -1;
        if (!aPreferred && bPreferred) return 1;
        return b.finalScore - a.finalScore;
      });
    }

    return scored.map(({ source, finalScore }, index) => ({
      ...source,
      rank: index + 1,
      finalScore,
      relevanceScore: this.calculateRelevance(source, criteria),
    }));
  }

  filterByCredibility(sources: Source[], minScore: number): Source[] {
    return sources.filter(
      (source) => this.getCredibilityScore(source.domain) >= minScore,
    );
  }

  diversify(sources: Source[], maxPerDomain: number): Source[] {
    const domainCounts = new Map<string, number>();
    return sources.filter((source) => {
      const count = domainCounts.get(source.domain) || 0;
      if (count >= maxPerDomain) return false;
      domainCounts.set(source.domain, count + 1);
      return true;
    });
  }

  getCredibilityScore(domain: string): number {
    return getDomainCredibility(domain);
  }

  setWeights(weights: Partial<RankingWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  private calculateRelevance(
    source: Source,
    criteria: RankingCriteria,
  ): number {
    let score = source.relevanceScore || 0.5;

    // Boost if title contains query terms
    const queryTerms = criteria.query.toLowerCase().split(/\s+/);
    const titleLower = source.title.toLowerCase();
    const matchingTerms = queryTerms.filter((term) =>
      titleLower.includes(term),
    ).length;
    score += (matchingTerms / queryTerms.length) * 0.3;

    // Boost if snippet contains topics
    if (source.snippet) {
      const snippetLower = source.snippet.toLowerCase();
      const topicMatches = criteria.topics.filter((topic) =>
        snippetLower.includes(topic.toLowerCase()),
      ).length;
      score += (topicMatches / Math.max(criteria.topics.length, 1)) * 0.2;
    }

    return Math.min(1, score);
  }

  private calculateRecency(publishedAt?: Date): number {
    if (!publishedAt) return 0.5; // Unknown date gets neutral score

    const now = new Date();
    const ageInDays =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 7) return 1.0; // Last week
    if (ageInDays <= 30) return 0.9; // Last month
    if (ageInDays <= 90) return 0.8; // Last quarter
    if (ageInDays <= 365) return 0.6; // Last year
    if (ageInDays <= 730) return 0.4; // Last 2 years
    return 0.2; // Older
  }

  private calculateDepth(source: Source): number {
    let score = 0.5;

    // Boost for longer content
    if (source.wordCount) {
      if (source.wordCount > 2000) score += 0.3;
      else if (source.wordCount > 1000) score += 0.2;
      else if (source.wordCount > 500) score += 0.1;
    }

    // Boost for media
    if (source.media.length > 0) {
      score += Math.min(0.2, source.media.length * 0.05);
    }

    return Math.min(1, score);
  }
}
