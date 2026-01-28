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
import type { Source, SourceType } from "../domain/source.schema";
import { v4 as uuid } from "uuid";

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

    // Search using Google News RSS (works without API)
    const sources = await this.searchGoogleNews(query, maxResults);

    const result: SearchResult = {
      query,
      sources: sources.slice(0, maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime,
    };

    // Cache results
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
      return this.parseRssXml(xml, maxResults);
    } catch {
      return [];
    }
  }

  private parseRssXml(
    xml: string,
    maxResults: number,
  ): Omit<Source, "content" | "extractedAt">[] {
    const results: Omit<Source, "content" | "extractedAt">[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while (
      (match = itemRegex.exec(xml)) !== null &&
      results.length < maxResults
    ) {
      const item = match[1]!;

      const getTag = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1]!.trim() : "";
      };

      const getCdata = (tag: string) => {
        const m = item.match(
          new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`),
        );
        return m ? m[1]!.trim() : getTag(tag);
      };

      const title = getCdata("title").replace(/\s+/g, " ");
      let link = getTag("link");
      const pubDate = getTag("pubDate");
      const description = getCdata("description")
        .replace(/<[^>]*>/g, "")
        .slice(0, 300);

      // Extract source from title (Google News format: "Title - Source")
      let source = "News";
      const sourceMatch = title.match(/\s-\s([^-]+)$/);
      if (sourceMatch) {
        source = sourceMatch[1]!.trim();
      }

      // Google News wraps links, extract actual URL if possible
      if (link.includes("news.google.com")) {
        const urlMatch = item.match(/url=([^&"]+)/);
        if (urlMatch) {
          link = decodeURIComponent(urlMatch[1]!);
        }
      }

      if (title && link) {
        const domain = this.extractDomainFromSource(source);
        results.push({
          id: uuid(),
          url: link,
          title: title.replace(/\s-\s[^-]+$/, ""), // Remove source suffix
          snippet: description,
          domain,
          sourceType: "news" as SourceType,
          credibilityScore: this.estimateNewsCredibility(source, link),
          relevanceScore: 0.75,
          media: [],
          requiresAuth: false,
          publishedAt: pubDate ? new Date(pubDate) : undefined,
        });
      }
    }

    return results;
  }

  private extractDomainFromSource(source: string): string {
    const sourceLower = source.toLowerCase();

    const domainMap: Record<string, string> = {
      reuters: "reuters.com",
      bbc: "bbc.com",
      "bbc news": "bbc.com",
      npr: "npr.org",
      "new york times": "nytimes.com",
      nyt: "nytimes.com",
      "washington post": "washingtonpost.com",
      guardian: "theguardian.com",
      cnn: "cnn.com",
      "associated press": "apnews.com",
      ap: "apnews.com",
      bloomberg: "bloomberg.com",
    };

    for (const [key, domain] of Object.entries(domainMap)) {
      if (sourceLower.includes(key)) {
        return domain;
      }
    }

    return source.toLowerCase().replace(/\s+/g, "") + ".com";
  }

  private estimateNewsCredibility(source: string, url: string): number {
    const sourceLower = source.toLowerCase();
    let domain = "";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }

    // High credibility news sources
    const highCredibility = [
      "reuters",
      "bbc",
      "npr",
      "associated press",
      "ap news",
      "bloomberg",
      "economist",
      "financial times",
    ];

    // Medium-high credibility
    const mediumHigh = [
      "new york times",
      "washington post",
      "guardian",
      "wall street journal",
      "cnn",
      "abc news",
      "nbc news",
    ];

    for (const src of highCredibility) {
      if (
        sourceLower.includes(src) ||
        domain.includes(src.replace(/\s+/g, ""))
      ) {
        return 0.88;
      }
    }

    for (const src of mediumHigh) {
      if (
        sourceLower.includes(src) ||
        domain.includes(src.replace(/\s+/g, ""))
      ) {
        return 0.82;
      }
    }

    return 0.7; // Default news credibility
  }
}
