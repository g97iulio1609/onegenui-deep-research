/**
 * Deep Search - parsing and utility helpers
 */
import { v4 as uuid } from "uuid";
import type { SearchStrategy } from "../domain/research-query.schema.js";
import type { Source, SourceType } from "../domain/source.schema.js";
import type { SearchOptions } from "../ports/deep-search.port.js";

/** Map search strategy to source type */
export const STRATEGY_TO_TYPE: Record<SearchStrategy, SourceType> = {
  broad: "general",
  academic: "academic",
  news: "news",
  technical: "technical",
  social: "social",
  official: "official",
};

export interface RawSearchResult {
  url: string;
  title: string;
  snippet: string;
}

export function parseDuckDuckGoResults(
  html: string,
  maxResults: number,
): RawSearchResult[] {
  const results: RawSearchResult[] = [];

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
        url: cleanUrl(url),
        title: cleanText(title),
        snippet: cleanText(snippet),
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

export function cleanUrl(url: string): string {
  if (url.includes("uddg=")) {
    const match = url.match(/uddg=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return url;
}

export function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function toSource(
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
    credibilityScore: estimateCredibility(url.hostname),
    relevanceScore: 0.5,
    media: [],
    requiresAuth: false,
  };
}

export function estimateCredibility(domain: string): number {
  const cleanDomain = domain.replace("www.", "");

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

  if (
    cleanDomain.includes("wikipedia.org") ||
    cleanDomain.includes("github.com") ||
    cleanDomain.includes("stackoverflow.com") ||
    cleanDomain.includes("bbc.com") ||
    cleanDomain.includes("reuters.com")
  ) {
    return 0.8;
  }

  if (
    cleanDomain.includes("medium.com") ||
    cleanDomain.includes("dev.to") ||
    cleanDomain.endsWith(".org")
  ) {
    return 0.7;
  }

  return 0.5;
}

export function getCacheKey(query: string, options: SearchOptions): string {
  return `${query}|${options.strategy}|${options.maxResults}`;
}
