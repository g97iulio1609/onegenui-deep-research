/**
 * Lightweight Scraper - utility helpers
 */
import type { ScrapedContent } from "../ports/content-scraper.port.js";
import type { MediaItem } from "../domain/source.schema.js";

/** User agents for rotation */
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

export function extractMainContent(html: string, maxLength: number): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const mainMatch =
    text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    text.match(
      /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

  if (mainMatch) {
    text = mainMatch[1];
  }

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

export function extractMedia(html: string, baseUrl: string): MediaItem[] {
  const media: MediaItem[] = [];
  const baseUrlObj = new URL(baseUrl);

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && media.length < 10) {
    const src = resolveUrl(imgMatch[1], baseUrlObj);
    if (src && !src.includes("data:") && !src.includes("pixel")) {
      const altMatch = imgMatch[0].match(/alt=["']([^"']+)["']/i);
      media.push({
        type: "image",
        url: src,
        title: altMatch?.[1],
      });
    }
  }

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

export function resolveUrl(src: string, baseUrl: URL): string | null {
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

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function errorResult(
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
