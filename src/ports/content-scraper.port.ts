/**
 * Content Scraper Port - lightweight content extraction without browser
 */
import type { Source, MediaItem } from "../domain/source.schema.js";

export interface ScrapeOptions {
  timeout: number;
  extractMedia: boolean;
  maxContentLength?: number;
  followRedirects?: boolean;
  userAgent?: string;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string; // Main text content
  excerpt: string; // Short summary
  author?: string;
  publishedAt?: Date;
  media: MediaItem[];
  wordCount: number;
  language?: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

export interface ScrapeProgress {
  url: string;
  status: "pending" | "fetching" | "extracting" | "completed" | "failed";
  progress: number;
}

/**
 * Port for content scraping - NO BROWSER required
 * Uses HTTP requests + HTML parsing for max performance
 */
export interface ContentScraperPort {
  /** Scrape content from a single URL */
  scrape(url: string, options: ScrapeOptions): Promise<ScrapedContent>;

  /** Scrape multiple URLs with concurrency control */
  scrapeMany(
    urls: string[],
    options: ScrapeOptions,
    onProgress?: (progress: ScrapeProgress) => void,
  ): AsyncGenerator<ScrapedContent, void, unknown>;

  /** Check if URL is likely scrapeable without browser */
  canScrapeWithoutBrowser(url: string): boolean;

  /** Get supported domains for optimized scraping */
  getSupportedDomains(): string[];
}
