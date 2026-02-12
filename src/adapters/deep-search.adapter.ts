/**
 * Search Adapter - wraps existing web-search for deep research
 * Reuses @onegenui/web-search infrastructure
 */
import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
import type {
  DeepSearchPort,
  SearchOptions,
  SearchResult,
  SearchProgress,
} from "../ports/deep-search.port.js";
import type { SubQuery } from "../domain/research-query.schema.js";
import {
  parseDuckDuckGoResults,
  toSource,
  getCacheKey,
  type RawSearchResult,
} from "./deep-search-utils.js";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

export interface SearchAdapterConfig {
  maxConcurrency?: number;
  defaultTimeout?: number;
}

export class DeepSearchAdapter implements DeepSearchPort {
  private cache: LRUCache<string, SearchResult>;
  private concurrencyLimit: ReturnType<typeof pLimit>;
  private defaultTimeout: number;

  constructor(config: SearchAdapterConfig = {}) {
    this.cache = new LRUCache({ max: CACHE_MAX, ttl: CACHE_TTL });
    this.concurrencyLimit = pLimit(config.maxConcurrency ?? 10);
    this.defaultTimeout = config.defaultTimeout ?? 30000;
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const cacheKey = getCacheKey(query, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      const searchQuery = this.buildSearchQuery(query, options);
      const results = await this.executeSearch(searchQuery, options);

      const searchResult: SearchResult = {
        query,
        sources: results.map((r) => toSource(r, options.strategy)),
        totalFound: results.length,
        durationMs: Date.now() - startTime,
      };

      this.cache.set(cacheKey, searchResult);
      return searchResult;
    } catch (error) {
      return {
        query,
        sources: [],
        totalFound: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async *searchParallel(
    queries: SubQuery[],
    options: SearchOptions,
    onProgress?: (progress: SearchProgress) => void,
  ): AsyncGenerator<SearchResult, void, unknown> {
    const sortedQueries = [...queries].sort((a, b) => b.priority - a.priority);

    const tasks = sortedQueries.map((subQuery) =>
      this.concurrencyLimit(async () => {
        onProgress?.({
          query: subQuery.query,
          status: "searching",
          progress: 0.5,
          resultsFound: 0,
        });

        const result = await this.search(subQuery.query, {
          ...options,
          strategy: subQuery.strategy,
        });

        onProgress?.({
          query: subQuery.query,
          status: "completed",
          progress: 1,
          resultsFound: result.sources.length,
        });

        return result;
      }),
    );

    for (const task of tasks) {
      yield await task;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.search("test", {
        maxResults: 1,
        timeout: 5000,
        strategy: "broad",
      });
      return result.sources.length >= 0;
    } catch {
      return false;
    }
  }

  getName(): string {
    return "DeepSearchAdapter";
  }

  private buildSearchQuery(query: string, options: SearchOptions): string {
    let searchQuery = query;

    if (options.strategy === "academic") {
      searchQuery = `${query} site:arxiv.org OR site:scholar.google.com OR site:pubmed.gov OR site:nature.com`;
    }

    if (options.strategy === "official") {
      searchQuery = `${query} site:gov OR site:edu OR site:org`;
    }

    if (options.strategy === "technical") {
      searchQuery = `${query} site:github.com OR site:stackoverflow.com OR site:dev.to`;
    }

    if (options.dateRange?.start || options.dateRange?.end) {
      const start = options.dateRange.start?.toISOString().split("T")[0];
      const end = options.dateRange.end?.toISOString().split("T")[0];
      if (start && end) {
        searchQuery = `${searchQuery} date:${start}..${end}`;
      }
    }

    return searchQuery;
  }

  private async executeSearch(
    query: string,
    options: SearchOptions,
  ): Promise<RawSearchResult[]> {
    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout,
    );

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      return parseDuckDuckGoResults(html, options.maxResults);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
