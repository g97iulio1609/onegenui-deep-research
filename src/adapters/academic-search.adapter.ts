/**
 * Academic Search Adapter
 *
 * Provides access to academic sources:
 * - Semantic Scholar (API with optional key)
 * - arXiv (open access)
 * - PubMed (API with optional key)
 */
import type {
  DeepSearchPort,
  SearchResult,
  SearchOptions,
  SearchProgress,
} from "../ports/deep-search.port";
import type { SubQuery, SearchStrategy } from "../domain/research-query.schema";
import type { Source, SourceType } from "../domain/source.schema";
import { ApiKeyAuthAdapter } from "./api-key-auth.adapter";
import { v4 as uuid } from "uuid";

// LRU cache for academic results
const resultCache = new Map<
  string,
  { result: SearchResult; timestamp: number }
>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for academic results

export class AcademicSearchAdapter implements DeepSearchPort {
  private apiKeyAuth: ApiKeyAuthAdapter;

  constructor(apiKeyAuth?: ApiKeyAuthAdapter) {
    this.apiKeyAuth = apiKeyAuth || new ApiKeyAuthAdapter();
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = `academic:${query}:${options.strategy}`;
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    const sources: Omit<Source, "content" | "extractedAt">[] = [];

    // Search academic sources in parallel
    const [semanticResults, arxivResults] = await Promise.allSettled([
      this.searchSemanticScholar(query, options.maxResults),
      this.searchArxiv(query, options.maxResults),
    ]);

    if (semanticResults.status === "fulfilled") {
      sources.push(...semanticResults.value);
    }

    if (arxivResults.status === "fulfilled") {
      sources.push(...arxivResults.value);
    }

    const result: SearchResult = {
      query,
      sources: sources.slice(0, options.maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime,
    };

    // Cache results
    resultCache.set(cacheKey, { result, timestamp: Date.now() });

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
        "https://api.semanticscholar.org/graph/v1/paper/649def34f8be52c8b66281af98ae884c09aef38b?fields=title",
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
    return "academic-search";
  }

  private async searchSemanticScholar(
    query: string,
    maxResults = 10,
  ): Promise<Omit<Source, "content" | "extractedAt">[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${maxResults}&fields=title,url,abstract,year,citationCount,authors`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      // Add API key if available
      const authHeaders = this.apiKeyAuth.getAuthHeaders("semantic_scholar");
      if (authHeaders) {
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(url, { headers });
      if (!response.ok) return [];

      const data = await response.json();
      const papers = data.data || [];

      return papers.map((paper: Record<string, unknown>) =>
        this.mapPaperToSource(paper, "semantic_scholar"),
      );
    } catch {
      return [];
    }
  }

  private async searchArxiv(
    query: string,
    maxResults = 10,
  ): Promise<Omit<Source, "content" | "extractedAt">[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const text = await response.text();
      return this.parseArxivXml(text);
    } catch {
      return [];
    }
  }

  private parseArxivXml(
    xml: string,
  ): Omit<Source, "content" | "extractedAt">[] {
    const results: Omit<Source, "content" | "extractedAt">[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]!;

      const getId = (tag: string) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1]!.trim() : "";
      };

      const title = getId("title").replace(/\s+/g, " ");
      const summary = getId("summary").replace(/\s+/g, " ");
      const id = getId("id");
      const published = getId("published");

      if (title && id) {
        results.push({
          id: uuid(),
          url: id,
          title,
          snippet: summary.slice(0, 300),
          domain: "arxiv.org",
          sourceType: "academic" as SourceType,
          credibilityScore: 0.88,
          relevanceScore: 0.8,
          media: [],
          requiresAuth: false,
          publishedAt: published ? new Date(published) : undefined,
        });
      }
    }

    return results;
  }

  private mapPaperToSource(
    paper: Record<string, unknown>,
    source: string,
  ): Omit<Source, "content" | "extractedAt"> {
    const authors = Array.isArray(paper.authors)
      ? paper.authors.map(
          (a: Record<string, unknown>) => (a.name as string) || "",
        )
      : [];

    return {
      id: uuid(),
      url:
        (paper.url as string) ||
        `https://semanticscholar.org/paper/${paper.paperId}`,
      title: (paper.title as string) || "Untitled",
      snippet: ((paper.abstract as string) || "").slice(0, 300),
      domain:
        source === "semantic_scholar" ? "semanticscholar.org" : "arxiv.org",
      sourceType: "academic" as SourceType,
      credibilityScore: this.calculateAcademicCredibility(paper),
      relevanceScore: 0.8,
      media: [],
      requiresAuth: false,
      author: authors.join(", "),
      publishedAt: paper.year ? new Date(`${paper.year}-01-01`) : undefined,
    };
  }

  private calculateAcademicCredibility(paper: Record<string, unknown>): number {
    let score = 0.8; // Base academic score

    // Boost for citations
    const citations = paper.citationCount as number | undefined;
    if (typeof citations === "number") {
      if (citations > 100) score += 0.1;
      else if (citations > 50) score += 0.07;
      else if (citations > 10) score += 0.05;
    }

    // Recent papers slightly boosted
    const year = paper.year as number | undefined;
    if (typeof year === "number" && year >= new Date().getFullYear() - 2) {
      score += 0.02;
    }

    return Math.min(score, 0.95);
  }
}
