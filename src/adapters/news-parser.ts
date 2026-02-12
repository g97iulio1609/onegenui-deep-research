/**
 * News Search - RSS parsing and credibility helpers
 */
import { v4 as uuid } from "uuid";
import type { Source, SourceType } from "../domain/source.schema.js";

export function parseRssXml(
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

    let source = "News";
    const sourceMatch = title.match(/\s-\s([^-]+)$/);
    if (sourceMatch) {
      source = sourceMatch[1]!.trim();
    }

    if (link.includes("news.google.com")) {
      const urlMatch = item.match(/url=([^&"]+)/);
      if (urlMatch) {
        link = decodeURIComponent(urlMatch[1]!);
      }
    }

    if (title && link) {
      const domain = extractDomainFromSource(source);
      results.push({
        id: uuid(),
        url: link,
        title: title.replace(/\s-\s[^-]+$/, ""),
        snippet: description,
        domain,
        sourceType: "news" as SourceType,
        credibilityScore: estimateNewsCredibility(source, link),
        relevanceScore: 0.75,
        media: [],
        requiresAuth: false,
        publishedAt: pubDate ? new Date(pubDate) : undefined,
      });
    }
  }

  return results;
}

export function extractDomainFromSource(source: string): string {
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

export function estimateNewsCredibility(source: string, url: string): number {
  const sourceLower = source.toLowerCase();
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }

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

  return 0.7;
}
