/**
 * Vectorless Knowledge Base Adapter
 *
 * Integrates scraped content with vectorless for comprehensive report generation.
 * Uses in-memory storage for research session with semantic chunking.
 */

import type {
  VectorlessKnowledgeBasePort,
  VectorlessDocument,
  VectorlessIndexOptions,
  VectorlessQueryOptions,
  VectorlessQueryResult,
} from "../ports/vectorless-kb.port.js";
import type { LLMPort } from "../ports/llm.port.js";

interface StoredChunk {
  documentId: string;
  chunk: string;
  metadata: Record<string, unknown>;
}

export class VectorlessKnowledgeBaseAdapter implements VectorlessKnowledgeBasePort {
  private chunks: Map<string, StoredChunk[]> = new Map();
  private documents: Map<string, VectorlessDocument> = new Map();
  private enabled: boolean;

  constructor(
    private llm: LLMPort,
    options?: { enabled?: boolean },
  ) {
    this.enabled = options?.enabled ?? true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async indexDocuments(
    documents: VectorlessDocument[],
    options?: VectorlessIndexOptions,
  ): Promise<{ indexed: number; failed: number }> {
    if (!this.enabled) return { indexed: 0, failed: 0 };

    const maxTokensPerNode = options?.maxTokensPerNode ?? 2000;
    let indexed = 0;
    let failed = 0;

    for (const doc of documents) {
      try {
        this.documents.set(doc.id, doc);

        // Chunk the content
        const chunks = this.chunkContent(doc.content, maxTokensPerNode);
        const storedChunks: StoredChunk[] = chunks.map((chunk, i) => ({
          documentId: doc.id,
          chunk,
          metadata: {
            ...doc.metadata,
            chunkIndex: i,
            url: doc.url,
            title: doc.title,
          },
        }));

        this.chunks.set(doc.id, storedChunks);
        indexed++;
      } catch {
        failed++;
      }
    }

    return { indexed, failed };
  }

  async query(
    query: string,
    options?: VectorlessQueryOptions,
  ): Promise<VectorlessQueryResult[]> {
    if (!this.enabled) return [];

    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0.3;
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

    const results: VectorlessQueryResult[] = [];

    for (const [docId, chunks] of this.chunks) {
      for (const chunk of chunks) {
        const score = this.calculateRelevance(chunk.chunk, queryTerms);
        if (score >= minScore) {
          results.push({
            documentId: docId,
            chunk: chunk.chunk,
            score,
            metadata: chunk.metadata,
          });
        }
      }
    }

    // Sort by score and take top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async *generateReport(
    query: string,
    context: {
      findings: string[];
      sources: { url: string; title: string }[];
      topics: string[];
    },
  ): AsyncGenerator<{ type: "chunk" | "complete"; content: string }> {
    // Get relevant chunks from knowledge base
    const relevantChunks = await this.query(query, { topK: 20, minScore: 0.2 });

    const knowledgeContext = relevantChunks
      .map((r) => `[Source: ${r.metadata.title ?? "Unknown"}]\n${r.chunk}`)
      .join("\n\n---\n\n");

    const findingsText = context.findings.slice(0, 15).join("\n- ");
    const sourcesText = context.sources
      .slice(0, 20)
      .map((s) => `- ${s.title}: ${s.url}`)
      .join("\n");

    const prompt = `You are a research analyst writing a comprehensive, detailed report.

RESEARCH QUERY: ${query}

MAIN TOPICS: ${context.topics.join(", ")}

KEY FINDINGS:
- ${findingsText}

KNOWLEDGE BASE CONTENT:
${knowledgeContext}

SOURCES:
${sourcesText}

Write a comprehensive, well-structured research report that:
1. Has an executive summary
2. Covers all main topics in depth with multiple sections
3. Includes specific data, statistics, and quotes from sources
4. Provides analysis and insights
5. Has a conclusion with key takeaways
6. Uses proper citations [Source Name]

The report should be detailed, professional, and at least 2000 words.
Use markdown formatting with headers, bullet points, and emphasis.`;

    // Stream the report generation
    let fullContent = "";

    for await (const chunk of this.llm.streamText(prompt, {
      maxTokens: 16000,
      temperature: 0.7,
    })) {
      fullContent += chunk;
      yield { type: "chunk", content: chunk };
    }

    yield { type: "complete", content: fullContent };
  }

  async clear(sessionId: string): Promise<void> {
    // Clear all documents for the session
    this.chunks.clear();
    this.documents.clear();
  }

  private chunkContent(content: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    const charsPerToken = 4; // Rough estimate
    const maxChars = maxTokens * charsPerToken;

    // Split by paragraphs first
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = "";

    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // If single paragraph is too long, split by sentences
        if (para.length > maxChars) {
          const sentences = para.split(/(?<=[.!?])\s+/);
          currentChunk = "";
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChars) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = sentence + " ";
            } else {
              currentChunk += sentence + " ";
            }
          }
        } else {
          currentChunk = para + "\n\n";
        }
      } else {
        currentChunk += para + "\n\n";
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private calculateRelevance(text: string, queryTerms: string[]): number {
    const textLower = text.toLowerCase();
    let matches = 0;
    let totalWeight = 0;

    for (const term of queryTerms) {
      const weight = term.length > 5 ? 2 : 1;
      if (textLower.includes(term)) {
        matches += weight;
      }
      totalWeight += weight;
    }

    // Add length bonus for substantial content
    const lengthBonus = Math.min(text.length / 1000, 0.2);

    return totalWeight > 0 ? (matches / totalWeight) * 0.8 + lengthBonus : 0;
  }
}
