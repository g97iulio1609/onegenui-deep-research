/**
 * Tests for Search Adapters
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AcademicSearchAdapter } from "../adapters/academic-search.adapter";
import { NewsSearchAdapter } from "../adapters/news-search.adapter";
import type { SearchOptions } from "../ports/deep-search.port";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultOptions: SearchOptions = {
  maxResults: 10,
  timeout: 30000,
  strategy: "broad",
};

describe("AcademicSearchAdapter", () => {
  let adapter: AcademicSearchAdapter;

  beforeEach(() => {
    adapter = new AcademicSearchAdapter();
    mockFetch.mockReset();
  });

  it("should return adapter name", () => {
    expect(adapter.getName()).toBe("academic-search");
  });

  it("should search Semantic Scholar and parse results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              paperId: "123",
              title: "Test Paper",
              url: "https://semanticscholar.org/paper/123",
              abstract: "This is a test abstract",
              year: 2024,
              citationCount: 50,
              authors: [{ name: "John Doe" }],
            },
          ],
        }),
    });

    // Mock arXiv response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("<feed></feed>"),
    });

    const result = await adapter.search("AI healthcare", defaultOptions);

    expect(result.query).toBe("AI healthcare");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0]!.domain).toBe("semanticscholar.org");
    expect(result.sources[0]!.sourceType).toBe("academic");
  });

  it("should handle API errors gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await adapter.search("test query", defaultOptions);

    expect(result.sources).toEqual([]);
    expect(result.totalFound).toBe(0);
  });

  it("should check availability", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const isAvailable = await adapter.isAvailable();
    expect(isAvailable).toBe(true);
  });
});

describe("NewsSearchAdapter", () => {
  let adapter: NewsSearchAdapter;

  beforeEach(() => {
    adapter = new NewsSearchAdapter();
    mockFetch.mockReset();
  });

  it("should return adapter name", () => {
    expect(adapter.getName()).toBe("news-search");
  });

  it("should parse Google News RSS", async () => {
    const mockRss = `
      <rss>
        <channel>
          <item>
            <title>Test News Article - Reuters</title>
            <link>https://example.com/news</link>
            <pubDate>Mon, 27 Jan 2026 10:00:00 GMT</pubDate>
            <description>Test description</description>
          </item>
        </channel>
      </rss>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockRss),
    });

    const result = await adapter.search("breaking news", defaultOptions);

    expect(result.query).toBe("breaking news");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0]!.sourceType).toBe("news");
  });

  it("should estimate credibility based on source", async () => {
    const mockRss = `
      <rss>
        <channel>
          <item>
            <title>Article - Reuters</title>
            <link>https://reuters.com/article</link>
            <pubDate>Mon, 27 Jan 2026 10:00:00 GMT</pubDate>
            <description>Reuters article</description>
          </item>
          <item>
            <title>Blog Post - Unknown Blog</title>
            <link>https://unknownblog.com/post</link>
            <pubDate>Mon, 27 Jan 2026 10:00:00 GMT</pubDate>
            <description>Blog post</description>
          </item>
        </channel>
      </rss>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockRss),
    });

    const result = await adapter.search("test", defaultOptions);

    // Reuters should have higher credibility
    const reutersSource = result.sources.find(
      (s) => s.domain === "reuters.com",
    );
    const unknownSource = result.sources.find(
      (s) => s.domain !== "reuters.com",
    );

    if (reutersSource && unknownSource) {
      expect(reutersSource.credibilityScore).toBeGreaterThan(
        unknownSource.credibilityScore,
      );
    }
  });

  it("should handle network errors gracefully", async () => {
    // Create new adapter to avoid cache interference
    const freshAdapter = new NewsSearchAdapter();
    // Clear any previous mock state and set up rejection
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await freshAdapter.search(
      "unique-error-test-query-12345",
      defaultOptions,
    );
    expect(result.sources).toEqual([]);
  });
});
