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
import type {
  SubQuery,
  SearchStrategy,
} from "../domain/research-query.schema.js";
import type { Source, SourceType } from "../domain/source.schema.js";
import { v4 as uuid } from "uuid";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

/** Map search strategy to source type */
const STRATEGY_TO_TYPE: Record<SearchStrategy, SourceType> = {
  broad: "general",
  academic: "academic",
  news: "news",
  technical: "technical",
  social: "social",
  official: "official",
};

/** Search engines by strategy */
const STRATEGY_ENGINES: Record<SearchStrategy, string> = {
  broad: "duckduckgo",
  academic: "google", // with site:scholar.google.com or arxiv.org
  news: "duckduckgo", // with news type
  technical: "duckduckgo",
  social: "duckduckgo",
  official: "google",
};

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
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      const searchQuery = this.buildSearchQuery(query, options);
      const results = await this.executeSearch(searchQuery, options);

      const searchResult: SearchResult = {
        query,
        sources: results.map((r) => this.toSource(r, options.strategy)),
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
    // Sort by priority
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

    // Add site restrictions for academic search
    if (options.strategy === "academic") {
      searchQuery = `${query} site:arxiv.org OR site:scholar.google.com OR site:pubmed.gov OR site:nature.com`;
    }

    // Add site restrictions for official sources
    if (options.strategy === "official") {
      searchQuery = `${query} site:gov OR site:edu OR site:org`;
    }

    // Add technical site restrictions
    if (options.strategy === "technical") {
      searchQuery = `${query} site:github.com OR site:stackoverflow.com OR site:dev.to`;
    }

    // Add date range if specified
    if (options.dateRange?.start || options.dateRange?.end) {
      // DuckDuckGo date syntax
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
    // Use DuckDuckGo HTML search (no API key needed, no browser)
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
      return this.parseDuckDuckGoResults(html, options.maxResults);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseDuckDuckGoResults(
    html: string,
    maxResults: number,
  ): RawSearchResult[] {
    const results: RawSearchResult[] = [];

    // Parse DuckDuckGo HTML results
    const resultRegex =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]*)/gi;

    let match;
    while (
      (match = resultRegex.exec(html)) !== null &&
      results.length < maxResults
    ) {
      const [, url, title, snippet] = match;
      if (url && title && !url.includes("duckduckgo.com")) {
        results.push({
          url: this.cleanUrl(url),
          title: this.cleanText(title),
          snippet: this.cleanText(snippet),
        });
      }
    }

    // Fallback: simpler regex if first doesn't work
    if (results.length === 0) {
      const simpleRegex =
        /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
      while (
        (match = simpleRegex.exec(html)) !== null &&
        results.length < maxResults
      ) {
        const url = match[1];
        if (!url.includes("duckduckgo.com")) {
          results.push({ url, title: "", snippet: "" });
        }
      }
    }

    return results;
  }

  private cleanUrl(url: string): string {
    // DuckDuckGo wraps URLs
    if (url.includes("uddg=")) {
      const match = url.match(/uddg=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return url;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  private toSource(
    result: RawSearchResult,
    strategy: SearchStrategy,
  ): Omit<Source, "content" | "extractedAt"> {
    const url = new URL(result.url);

    return {
      id: uuid(),
      url: result.url,
      title: result.title || url.hostname,
      snippet: result.snippet,
      domain: url.hostname.replace("www.", ""),
      sourceType: STRATEGY_TO_TYPE[strategy],
      credibilityScore: this.estimateCredibility(url.hostname),
      relevanceScore: 0.5, // Will be calculated later by ranker
      media: [],
      requiresAuth: false,
    };
  }

  private estimateCredibility(domain: string): number {
    const cleanDomain = domain.replace("www.", "");

    // High credibility sources
    if (
      cleanDomain.endsWith(".gov") ||
      cleanDomain.endsWith(".edu") ||
      cleanDomain.includes("nature.com") ||
      cleanDomain.includes("science.org") ||
      cleanDomain.includes("arxiv.org") ||
      cleanDomain.includes("pubmed")
    ) {
      return 0.9;
    }

    // Medium-high credibility
    if (
      cleanDomain.includes("wikipedia.org") ||
      cleanDomain.includes("github.com") ||
      cleanDomain.includes("stackoverflow.com") ||
      cleanDomain.includes("bbc.com") ||
      cleanDomain.includes("reuters.com")
    ) {
      return 0.8;
    }

    // Medium credibility
    if (
      cleanDomain.includes("medium.com") ||
      cleanDomain.includes("dev.to") ||
      cleanDomain.endsWith(".org")
    ) {
      return 0.7;
    }

    return 0.5;
  }

  private getCacheKey(query: string, options: SearchOptions): string {
    return `${query}|${options.strategy}|${options.maxResults}`;
  }
}

interface RawSearchResult {
  url: string;
  title: string;
  snippet: string;
}
