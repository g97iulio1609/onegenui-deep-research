/**
 * Lightweight HTTP Scraper Adapter - NO BROWSER
 * Uses fetch + HTML parsing for maximum performance
 */
import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
import type {
  ContentScraperPort,
  ScrapedContent,
  ScrapeOptions,
  ScrapeProgress,
} from "../ports/content-scraper.port.js";
import {
  requiresJavaScript,
  DEFAULT_SCRAPING_CONFIG,
  type ScrapingConfig,
} from "../config.js";
import {
  extractMainContent,
  extractMedia,
  getRandomUserAgent,
  errorResult,
} from "./scraper-utils.js";

export class LightweightScraperAdapter implements ContentScraperPort {
  private cache: LRUCache<string, ScrapedContent>;
  private concurrencyLimit: ReturnType<typeof pLimit>;
  private config: ScrapingConfig;

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = { ...DEFAULT_SCRAPING_CONFIG, ...config };
    this.cache = new LRUCache({
      max: 500,
      ttl: this.config.cacheTtlMs,
    });
    this.concurrencyLimit = pLimit(this.config.maxConcurrent);
  }

  async scrape(url: string, options: ScrapeOptions): Promise<ScrapedContent> {
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(url, options);
      if (!response.ok) {
        return errorResult(url, `HTTP ${response.status}`, startTime);
      }

      const html = await response.text();
      const result = this.parseHtml(url, html, options);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return errorResult(url, message, startTime);
    }
  }

  async *scrapeMany(
    urls: string[],
    options: ScrapeOptions,
    onProgress?: (progress: ScrapeProgress) => void,
  ): AsyncGenerator<ScrapedContent, void, unknown> {
    const tasks = urls.map((url) =>
      this.concurrencyLimit(async () => {
        onProgress?.({ url, status: "fetching", progress: 0 });
        const result = await this.scrape(url, options);
        onProgress?.({
          url,
          status: result.success ? "completed" : "failed",
          progress: 1,
        });
        return result;
      }),
    );

    for (const task of tasks) {
      yield await task;
    }
  }

  canScrapeWithoutBrowser(url: string): boolean {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return !requiresJavaScript(domain);
    } catch {
      return false;
    }
  }

  getSupportedDomains(): string[] {
    return [
      "wikipedia.org",
      "github.com",
      "arxiv.org",
      "medium.com",
      "dev.to",
      "stackoverflow.com",
      "news.ycombinator.com",
      "reddit.com",
      "bbc.com",
      "cnn.com",
      "reuters.com",
      "nature.com",
      "sciencedirect.com",
    ];
  }

  private async fetchWithTimeout(
    url: string,
    options: ScrapeOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = options.timeout || this.config.timeoutMs;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": options.userAgent || getRandomUserAgent(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        redirect: options.followRedirects ? "follow" : "manual",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseHtml(
    url: string,
    html: string,
    options: ScrapeOptions,
  ): ScrapedContent {
    const startTime = Date.now();
    const maxLength = options.maxContentLength || this.config.maxContentLength;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";

    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    const excerpt = descMatch?.[1]?.trim() || "";

    const authorMatch =
      html.match(
        /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i,
      );
    const author = authorMatch?.[1]?.trim();

    const dateMatch =
      html.match(
        /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      ) || html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
    const publishedAt = dateMatch?.[1] ? new Date(dateMatch[1]) : undefined;

    const content = extractMainContent(html, maxLength);
    const media = options.extractMedia ? extractMedia(html, url) : [];

    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const language = langMatch?.[1]?.substring(0, 2);

    return {
      url,
      title,
      content,
      excerpt,
      author,
      publishedAt:
        publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : undefined,
      media,
      wordCount: content.split(/\s+/).length,
      language,
      success: true,
      durationMs: Date.now() - startTime,
    };
  }

  private getCacheKey(url: string, options: ScrapeOptions): string {
    return `${url}|${options.extractMedia}|${options.maxContentLength}`;
  }
}
