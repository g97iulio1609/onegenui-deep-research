/**
 * Research state management - types, factory, constants, and URL helpers
 */
import pLimit from "p-limit";
import type { WebSearchUseCase } from "@onegenui/web-search";

export interface SourceInfo {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
}

export interface ResearchState {
  sources: Map<string, SourceInfo>;
  scrapedContent: Map<string, string>;
  findings: string[];
  startTime: number;
  batchSummaries: Array<{ batchNum: number; summary: string; sourceCount: number }>;
  summarizedUrls: Set<string>;
  pendingSummaryPromises: Promise<void>[];
  batchCounter: number;
  stepCount: number;
}

export const BATCH_SIZE = 5;
export const MAX_CONTENT_PER_SOURCE = 5000;
export const SUMMARY_TARGET_CHARS = 5000;

export function createInitialState(): ResearchState {
  return {
    sources: new Map(),
    scrapedContent: new Map(),
    findings: [],
    startTime: Date.now(),
    batchSummaries: [],
    summarizedUrls: new Set(),
    pendingSummaryPromises: [],
    batchCounter: 0,
    stepCount: 0,
  };
}

/** Normalize DuckDuckGo redirect and protocol-relative URLs. */
export function normalizeUrl(url: string): string {
  let realUrl = url;
  if (realUrl.includes('duckduckgo.com/l/?uddg=')) {
    try {
      const match = realUrl.match(/uddg=([^&]+)/);
      if (match) realUrl = decodeURIComponent(match[1]);
    } catch { /* keep original */ }
  }
  if (realUrl.startsWith('//')) realUrl = 'https:' + realUrl;
  return realUrl;
}

/** Store search results in state, respecting maxSources. */
export function addSearchResults(
  state: ResearchState,
  results: Array<{ url?: string; title?: string; snippet?: string }>,
  maxSources: number,
): string[] {
  const newUrls: string[] = [];
  for (const result of results) {
    if (state.sources.size >= maxSources) break;
    const realUrl = result.url ? normalizeUrl(result.url) : null;
    if (!realUrl || state.sources.has(realUrl)) continue;
    try {
      const urlObj = new URL(realUrl);
      state.sources.set(realUrl, {
        url: realUrl,
        title: result.title || urlObj.hostname,
        domain: urlObj.hostname.replace("www.", ""),
        snippet: result.snippet,
      });
      newUrls.push(realUrl);
    } catch {
      console.log(`[DeepResearch] Invalid URL: ${realUrl}`);
    }
  }
  return newUrls;
}

/** Fire-and-forget background scraping of new URLs. */
export function backgroundScrape(
  state: ResearchState,
  urls: string[],
  webSearch: WebSearchUseCase,
): void {
  const toScrape = urls
    .filter(url => !state.scrapedContent.has(url))
    .slice(0, 5);
  if (toScrape.length === 0) return;

  console.log(`[DeepResearch] Starting background scraping for ${toScrape.length} URLs...`);
  const limit = pLimit(3);

  Promise.all(
    toScrape.map(url =>
      limit(async () => {
        try {
          const response = await webSearch.scrape(url, {
            timeout: 10000,
            maxContentLength: 15000,
            cache: true,
          });
          const content = response.result.content;
          if (content) {
            state.scrapedContent.set(url, content);
            console.log(`[DeepResearch] Background scraped: ${url.slice(0, 50)}... (${content.split(/\s+/).length} words)`);
          }
        } catch {
          console.log(`[DeepResearch] Background scrape failed: ${url.slice(0, 50)}...`);
        }
      })
    )
  ).then(() => {
    console.log(`[DeepResearch] Background scraping complete: ${state.scrapedContent.size} total scraped`);
  }).catch(err => {
    console.error(`[DeepResearch] Background scraping error:`, err);
  });
}
