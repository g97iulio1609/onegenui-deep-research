/**
 * Vectorless Knowledge Base Port
 *
 * Integrates vectorless as a knowledge base for deep research.
 * Enables storing scraped content and using it for comprehensive report generation.
 */

export interface VectorlessDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  metadata: {
    sourceId: string;
    domain: string;
    scrapedAt: Date;
    wordCount: number;
    relevanceScore?: number;
  };
}

export interface VectorlessQueryResult {
  documentId: string;
  chunk: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorlessIndexOptions {
  maxTokensPerNode?: number;
  enableSemanticChunking?: boolean;
}

export interface VectorlessQueryOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
}

export interface VectorlessKnowledgeBasePort {
  /**
   * Index documents into the knowledge base
   */
  indexDocuments(
    documents: VectorlessDocument[],
    options?: VectorlessIndexOptions,
  ): Promise<{ indexed: number; failed: number }>;

  /**
   * Query the knowledge base for relevant content
   */
  query(
    query: string,
    options?: VectorlessQueryOptions,
  ): Promise<VectorlessQueryResult[]>;

  /**
   * Generate a comprehensive report using the knowledge base
   */
  generateReport(
    query: string,
    context: {
      findings: string[];
      sources: { url: string; title: string }[];
      topics: string[];
    },
  ): AsyncGenerator<{ type: "chunk" | "complete"; content: string }>;

  /**
   * Clear the knowledge base for a research session
   */
  clear(sessionId: string): Promise<void>;

  /**
   * Check if vectorless integration is enabled
   */
  isEnabled(): boolean;
}
