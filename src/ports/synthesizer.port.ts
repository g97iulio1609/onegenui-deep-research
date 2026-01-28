/**
 * Synthesizer Port - report generation with streaming
 */
import type {
  Synthesis,
  Section,
  Citation,
} from "../domain/synthesis.schema.js";
import type { ResearchQuery } from "../domain/research-query.schema.js";
import type { AnalyzedContent } from "./content-analyzer.port.js";
import type { Source } from "../domain/source.schema.js";
import type { KnowledgeGraph } from "../domain/knowledge-graph.schema.js";

export interface SynthesisOptions {
  maxSummaryLength: number;
  maxSectionsCount: number;
  includeConflicts: boolean;
  generateRelatedQuestions: boolean;
  language: string;
}

export const DEFAULT_SYNTHESIS_OPTIONS: SynthesisOptions = {
  maxSummaryLength: 500,
  maxSectionsCount: 6,
  includeConflicts: true,
  generateRelatedQuestions: true,
  language: "en",
};

export interface SynthesisEvent {
  type:
    | "outline"
    | "summary"
    | "section"
    | "findings"
    | "questions"
    | "complete";
  data: unknown;
}

export interface OutlineSection {
  title: string;
  topics: string[];
  sourceIds: string[];
}

/**
 * Port for report synthesis with streaming support
 */
export interface SynthesizerPort {
  /** Generate complete synthesis with streaming events */
  synthesize(
    contents: AnalyzedContent[],
    sources: Source[],
    query: ResearchQuery,
    graph?: KnowledgeGraph,
    options?: Partial<SynthesisOptions>,
  ): AsyncGenerator<SynthesisEvent, Synthesis, unknown>;

  /** Generate outline for report structure */
  generateOutline(
    contents: AnalyzedContent[],
    query: ResearchQuery,
  ): Promise<OutlineSection[]>;

  /** Generate executive summary */
  generateSummary(
    contents: AnalyzedContent[],
    maxLength: number,
  ): Promise<string>;

  /** Generate a single section */
  generateSection(
    outline: OutlineSection,
    contents: AnalyzedContent[],
    sources: Source[],
  ): Promise<Section>;

  /** Format citations for bibliography */
  formatCitations(sources: Source[]): Citation[];
}
