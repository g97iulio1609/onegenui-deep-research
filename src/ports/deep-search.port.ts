/**
 * Deep Search Port - interface for search operations
 */
import type {
  SearchStrategy,
  SubQuery,
} from "../domain/research-query.schema.js";
import type { Source } from "../domain/source.schema.js";

export interface SearchOptions {
  maxResults: number;
  timeout: number;
  strategy: SearchStrategy;
  language?: string;
  dateRange?: { start?: Date; end?: Date };
  excludeDomains?: string[];
  includeDomains?: string[];
}

export interface SearchResult {
  query: string;
  sources: Omit<Source, "content" | "extractedAt">[];
  totalFound: number;
  durationMs: number;
}

export interface SearchProgress {
  query: string;
  status: "pending" | "searching" | "completed" | "failed";
  progress: number;
  resultsFound: number;
}

/**
 * Port for web search operations
 * Implementations: Crawl4AI (no browser), SearXNG, Brave, etc.
 */
export interface DeepSearchPort {
  /** Execute a single search query */
  search(query: string, options: SearchOptions): Promise<SearchResult>;

  /** Execute multiple queries in parallel with concurrency control */
  searchParallel(
    queries: SubQuery[],
    options: SearchOptions,
    onProgress?: (progress: SearchProgress) => void,
  ): AsyncGenerator<SearchResult, void, unknown>;

  /** Check if the search service is available */
  isAvailable(): Promise<boolean>;

  /** Get the name of this search provider */
  getName(): string;
}
