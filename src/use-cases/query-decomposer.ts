/**
 * Query Decomposer - breaks down queries into sub-queries
 */
import { v4 as uuid } from "uuid";
import type { LLMPort } from "../ports/llm.port.js";
import type {
  ResearchQuery,
  SubQuery,
  SearchStrategy,
} from "../domain/research-query.schema.js";
import type { EffortConfig } from "../domain/effort-level.schema.js";
import { z } from "zod";

const DecompositionSchema = z.object({
  refinedQuery: z.string(),
  mainTopics: z.array(z.string()),
  subQueries: z.array(
    z.object({
      query: z.string(),
      purpose: z.string(),
      strategy: z.enum([
        "broad",
        "academic",
        "news",
        "technical",
        "social",
        "official",
      ]),
      priority: z.number().min(1).max(10),
    }),
  ),
  temporalFocus: z.enum(["recent", "historical", "all", "specific"]),
  language: z.string(),
});

export class QueryDecomposer {
  constructor(private llm: LLMPort) {}

  async decompose(
    query: string,
    effort: EffortConfig,
    context?: string,
  ): Promise<ResearchQuery> {
    const subQueryCount = this.getSubQueryCount(effort);
    const prompt = this.buildPrompt(query, subQueryCount, context);

    const result = await this.llm.generate(prompt, DecompositionSchema);

    const subQueries: SubQuery[] = result.data.subQueries.map((sq, index) => ({
      id: uuid(),
      query: sq.query,
      purpose: sq.purpose,
      strategy: sq.strategy as SearchStrategy,
      priority: sq.priority,
      depth: 0,
    }));

    return {
      id: uuid(),
      originalQuery: query,
      refinedQuery: result.data.refinedQuery,
      mainTopics: result.data.mainTopics,
      subQueries,
      temporalFocus: result.data.temporalFocus,
      language: result.data.language,
      effort,
      context,
      createdAt: new Date(),
    };
  }

  private getSubQueryCount(effort: EffortConfig): number {
    switch (effort.level) {
      case "standard":
        return 5;
      case "deep":
        return 10;
      case "max":
        return 15;
    }
  }

  private buildPrompt(
    query: string,
    subQueryCount: number,
    context?: string,
  ): string {
    return `You are a research query decomposer. Break down the following query into sub-queries for comprehensive research.

QUERY: "${query}"
${context ? `CONTEXT: ${context}` : ""}

Generate exactly ${subQueryCount} sub-queries that cover different aspects and perspectives.

Requirements:
1. Each sub-query should target a specific aspect of the main query
2. Use different search strategies appropriately:
   - "broad": General web search
   - "academic": Scientific papers, research (arxiv, pubmed, scholar)
   - "news": Recent news and developments
   - "technical": Code, documentation, technical specs
   - "social": Discussions, opinions, community insights
   - "official": Government, official organizations
3. Assign priority 1-10 (10 = most important)
4. Identify the temporal focus (recent events vs historical)
5. Detect the primary language

Return a JSON object with:
- refinedQuery: An improved version of the original query
- mainTopics: Array of 3-5 main topics covered
- subQueries: Array of sub-queries with query, purpose, strategy, priority
- temporalFocus: "recent" | "historical" | "all" | "specific"
- language: ISO language code (e.g., "en", "it", "es")`;
  }
}
