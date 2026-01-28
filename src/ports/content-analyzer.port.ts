/**
 * Content Analyzer Port - entity extraction and analysis
 */
import type { Entity, Relationship } from "../domain/knowledge-graph.schema.js";
import type { Conflict, KeyFinding } from "../domain/synthesis.schema.js";

export interface AnalysisContext {
  query: string;
  topics: string[];
  sourceId: string;
}

export interface AnalyzedContent {
  sourceId: string;
  entities: Entity[];
  keyPoints: string[];
  claims: Claim[];
  sentiment?: "positive" | "negative" | "neutral";
  topics: string[];
  quality: ContentQuality;
}

export interface Claim {
  id: string;
  statement: string;
  confidence: number;
  sourceId: string;
  evidence: string;
}

export interface ContentQuality {
  relevance: number; // 0-1
  factualDensity: number; // 0-1
  clarity: number; // 0-1
  overall: number; // 0-1
}

/**
 * Port for content analysis using LLM
 */
export interface ContentAnalyzerPort {
  /** Analyze content and extract structured data */
  analyze(content: string, context: AnalysisContext): Promise<AnalyzedContent>;

  /** Extract named entities from content */
  extractEntities(content: string): Promise<Entity[]>;

  /** Extract relationships between entities */
  extractRelationships(
    content: string,
    entities: Entity[],
  ): Promise<Relationship[]>;

  /** Detect conflicting claims across multiple contents */
  detectConflicts(contents: AnalyzedContent[]): Promise<Conflict[]>;

  /** Extract key findings from analyzed content */
  extractKeyFindings(contents: AnalyzedContent[]): Promise<KeyFinding[]>;
}
