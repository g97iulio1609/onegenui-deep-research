/**
 * News Search Adapter
 *
 * Searches news sources for current events and recent information
 * Uses public RSS feeds and news aggregators
 */
import type {
  DeepSearchPort,
  SearchResult,
  SearchOptions,
  SearchProgress,
} from "../ports/deep-search.port";
import type { SubQuery } from "../domain/research-query.schema";
import type { Source } from "../domain/source.schema";
import { parseRssXml } from "./news-parser.js";

// Cache for news results
const newsCache = new Map<
  string,
  { result: SearchResult; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for news

export class NewsSearchAdapter implements DeepSearchPort {
  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = `news:${query}`;
    const cached = newsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    const maxResults = options.maxResults || 15;

    const sources = await this.searchGoogleNews(query, maxResults);

    const result: SearchResult = {
      query,
      sources: sources.slice(0, maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime,
    };

    newsCache.set(cacheKey, { result, timestamp: Date.now() });

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
        "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
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
    return "news-search";
  }

  private async searchGoogleNews(
    query: string,
    maxResults: number,
  ): Promise<Omit<Source, "content" | "extractedAt">[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const xml = await response.text();
      return parseRssXml(xml, maxResults);
    } catch {
      return [];
    }
  }
}
