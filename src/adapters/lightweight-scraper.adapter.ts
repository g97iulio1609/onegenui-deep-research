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
import type { MediaItem } from "../domain/source.schema.js";
import {
  requiresJavaScript,
  DEFAULT_SCRAPING_CONFIG,
  type ScrapingConfig,
} from "../config.js";

/** User agents for rotation */
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

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
        return this.errorResult(url, `HTTP ${response.status}`, startTime);
      }

      const html = await response.text();
      const result = this.parseHtml(url, html, options);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return this.errorResult(url, message, startTime);
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
          "User-Agent": options.userAgent || this.getRandomUserAgent(),
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

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    const excerpt = descMatch?.[1]?.trim() || "";

    // Extract author
    const authorMatch =
      html.match(
        /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i,
      );
    const author = authorMatch?.[1]?.trim();

    // Extract publish date
    const dateMatch =
      html.match(
        /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      ) || html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
    const publishedAt = dateMatch?.[1] ? new Date(dateMatch[1]) : undefined;

    // Extract main content
    const content = this.extractMainContent(html, maxLength);

    // Extract media if enabled
    const media = options.extractMedia ? this.extractMedia(html, url) : [];

    // Detect language
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

  private extractMainContent(html: string, maxLength: number): string {
    // Remove scripts, styles, and other non-content elements
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // Try to find main content area
    const mainMatch =
      text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      text.match(
        /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      );

    if (mainMatch) {
      text = mainMatch[1];
    }

    // Convert to plain text
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + "...";
    }

    return text;
  }

  private extractMedia(html: string, baseUrl: string): MediaItem[] {
    const media: MediaItem[] = [];
    const baseUrlObj = new URL(baseUrl);

    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null && media.length < 10) {
      const src = this.resolveUrl(imgMatch[1], baseUrlObj);
      if (src && !src.includes("data:") && !src.includes("pixel")) {
        const altMatch = imgMatch[0].match(/alt=["']([^"']+)["']/i);
        media.push({
          type: "image",
          url: src,
          title: altMatch?.[1],
        });
      }
    }

    // Extract videos (YouTube, Vimeo embeds)
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let iframeMatch;
    while (
      (iframeMatch = iframeRegex.exec(html)) !== null &&
      media.length < 15
    ) {
      const src = iframeMatch[1];
      if (src.includes("youtube.com") || src.includes("youtu.be")) {
        media.push({ type: "video", url: src });
      } else if (src.includes("vimeo.com")) {
        media.push({ type: "video", url: src });
      }
    }

    return media;
  }

  private resolveUrl(src: string, baseUrl: URL): string | null {
    try {
      if (src.startsWith("//")) {
        return `${baseUrl.protocol}${src}`;
      }
      if (src.startsWith("/")) {
        return `${baseUrl.origin}${src}`;
      }
      if (src.startsWith("http")) {
        return src;
      }
      return new URL(src, baseUrl.origin).href;
    } catch {
      return null;
    }
  }

  private getCacheKey(url: string, options: ScrapeOptions): string {
    return `${url}|${options.extractMedia}|${options.maxContentLength}`;
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private errorResult(
    url: string,
    error: string,
    startTime: number,
  ): ScrapedContent {
    return {
      url,
      title: "",
      content: "",
      excerpt: "",
      media: [],
      wordCount: 0,
      success: false,
      error,
      durationMs: Date.now() - startTime,
    };
  }
}
