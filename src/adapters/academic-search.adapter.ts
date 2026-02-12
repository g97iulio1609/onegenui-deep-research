/**
 * Academic Search Adapter
 *
 * Provides access to academic sources:
 * - Semantic Scholar (API with optional key)
 * - arXiv (open access)
 * - PubMed (API with optional key)
 */
import type {
  DeepSearchPort,
  SearchResult,
  SearchOptions,
  SearchProgress,
} from "../ports/deep-search.port";
import type { SubQuery } from "../domain/research-query.schema";
import type { Source } from "../domain/source.schema";
import { ApiKeyAuthAdapter } from "./api-key-auth.adapter";
import {
  parseArxivXml,
  mapPaperToSource,
} from "./academic-parsers.js";

// LRU cache for academic results
const resultCache = new Map<
  string,
  { result: SearchResult; timestamp: number }
>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for academic results

export class AcademicSearchAdapter implements DeepSearchPort {
  private apiKeyAuth: ApiKeyAuthAdapter;

  constructor(apiKeyAuth?: ApiKeyAuthAdapter) {
    this.apiKeyAuth = apiKeyAuth || new ApiKeyAuthAdapter();
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = `academic:${query}:${options.strategy}`;
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    const sources: Omit<Source, "content" | "extractedAt">[] = [];

    const [semanticResults, arxivResults] = await Promise.allSettled([
      this.searchSemanticScholar(query, options.maxResults),
      this.searchArxiv(query, options.maxResults),
    ]);

    if (semanticResults.status === "fulfilled") {
      sources.push(...semanticResults.value);
    }

    if (arxivResults.status === "fulfilled") {
      sources.push(...arxivResults.value);
    }

    const result: SearchResult = {
      query,
      sources: sources.slice(0, options.maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime,
    };

    resultCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  async *searchParallel(
    queries: SubQuery[],
    options: SearchOptions,
    onProgress?: (progress: SearchProgress) => void,
  ): AsyncGenerator<SearchResult, void, unknown> {
    for (const subQuery of queries) {
      onProgress?.({
        query: subQuery.query,
        status: "searching",
        progress: 0,
        resultsFound: 0,
      });

      const result = await this.search(subQuery.query, options);

      onProgress?.({
        query: subQuery.query,
        status: "completed",
        progress: 100,
        resultsFound: result.sources.length,
      });

      yield result;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        "https://api.semanticscholar.org/graph/v1/paper/649def34f8be52c8b66281af98ae884c09aef38b?fields=title",
        {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  getName(): string {
    return "academic-search";
  }

  private async searchSemanticScholar(
    query: string,
    maxResults = 10,
  ): Promise<Omit<Source, "content" | "extractedAt">[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${maxResults}&fields=title,url,abstract,year,citationCount,authors`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      const authHeaders = this.apiKeyAuth.getAuthHeaders("semantic_scholar");
      if (authHeaders) {
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(url, { headers });
      if (!response.ok) return [];

      const data = await response.json();
      const papers = data.data || [];

      return papers.map((paper: Record<string, unknown>) =>
        mapPaperToSource(paper, "semantic_scholar"),
      );
    } catch {
      return [];
    }
  }

  private async searchArxiv(
    query: string,
    maxResults = 10,
  ): Promise<Omit<Source, "content" | "extractedAt">[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const text = await response.text();
      return parseArxivXml(text);
    } catch {
      return [];
    }
  }
}
