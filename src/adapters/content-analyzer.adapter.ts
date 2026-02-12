/**
 * Content Analyzer Adapter - LLM-based content analysis
 */
import { v4 as uuid } from "uuid";
import { z } from "zod";
import type {
  ContentAnalyzerPort,
  AnalysisContext,
  AnalyzedContent,
  Claim,
  ContentQuality,
} from "../ports/content-analyzer.port.js";
import type { LLMPort } from "../ports/llm.port.js";
import type { Entity, Relationship } from "../domain/knowledge-graph.schema.js";
import type { Conflict, KeyFinding } from "../domain/synthesis.schema.js";
import {
  extractEntities as doExtractEntities,
  extractRelationships as doExtractRelationships,
  detectConflicts as doDetectConflicts,
  extractKeyFindings as doExtractKeyFindings,
} from "./content-analyzer-extractors.js";

const AnalysisResultSchema = z.object({
  keyPoints: z.array(z.string()),
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.enum([
        "person",
        "organization",
        "location",
        "concept",
        "event",
        "product",
        "technology",
        "date",
        "metric",
      ]),
      description: z.string().optional(),
    }),
  ),
  claims: z.array(
    z.object({
      statement: z.string(),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
    }),
  ),
  topics: z.array(z.string()),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  quality: z.object({
    relevance: z.number().min(0).max(1),
    factualDensity: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
  }),
});

export class ContentAnalyzerAdapter implements ContentAnalyzerPort {
  constructor(private llm: LLMPort) {}

  async analyze(
    content: string,
    context: AnalysisContext,
  ): Promise<AnalyzedContent> {
    const truncatedContent =
      content.length > 15000 ? content.slice(0, 15000) + "..." : content;

    const prompt = `Analyze the following content in the context of the research query.

QUERY: "${context.query}"
TOPICS OF INTEREST: ${context.topics.join(", ")}

CONTENT:
${truncatedContent}

Extract:
1. Key points (3-7 important insights)
2. Named entities (people, organizations, concepts, etc.)
3. Factual claims with confidence scores
4. Main topics covered
5. Overall sentiment
6. Quality assessment (relevance to query, factual density, clarity)

Return a JSON object with these fields.`;

    try {
      const result = await this.llm.generate(prompt, AnalysisResultSchema);

      const entities: Entity[] = result.data.entities.map((e) => ({
        id: uuid(),
        name: e.name,
        type: e.type,
        description: e.description,
        aliases: [],
        sourceIds: [context.sourceId],
        confidence: 0.8,
      }));

      const claims: Claim[] = result.data.claims.map((c) => ({
        id: uuid(),
        statement: c.statement,
        confidence: c.confidence,
        sourceId: context.sourceId,
        evidence: c.evidence,
      }));

      const quality: ContentQuality = {
        relevance: result.data.quality.relevance,
        factualDensity: result.data.quality.factualDensity,
        clarity: result.data.quality.clarity,
        overall:
          (result.data.quality.relevance +
            result.data.quality.factualDensity +
            result.data.quality.clarity) /
          3,
      };

      return {
        sourceId: context.sourceId,
        entities,
        keyPoints: result.data.keyPoints,
        claims,
        sentiment: result.data.sentiment,
        topics: result.data.topics,
        quality,
      };
    } catch (error) {
      return {
        sourceId: context.sourceId,
        entities: [],
        keyPoints: [],
        claims: [],
        topics: context.topics,
        quality: {
          relevance: 0.5,
          factualDensity: 0.5,
          clarity: 0.5,
          overall: 0.5,
        },
      };
    }
  }

  async extractEntities(content: string): Promise<Entity[]> {
    return doExtractEntities(this.llm, content);
  }

  async extractRelationships(
    content: string,
    entities: Entity[],
  ): Promise<Relationship[]> {
    return doExtractRelationships(this.llm, content, entities);
  }

  async detectConflicts(contents: AnalyzedContent[]): Promise<Conflict[]> {
    return doDetectConflicts(this.llm, contents);
  }

  async extractKeyFindings(contents: AnalyzedContent[]): Promise<KeyFinding[]> {
    return doExtractKeyFindings(this.llm, contents);
  }
}
