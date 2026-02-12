/**
 * Synthesizer Adapter - LLM-based report synthesis
 */
import { v4 as uuid } from "uuid";
import { z } from "zod";
import type {
  SynthesizerPort,
  SynthesisOptions,
  SynthesisEvent,
  OutlineSection,
  DEFAULT_SYNTHESIS_OPTIONS,
} from "../ports/synthesizer.port.js";
import type { LLMPort } from "../ports/llm.port.js";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type { Source } from "../domain/source.schema.js";
import type { ResearchQuery } from "../domain/research-query.schema.js";
import type { KnowledgeGraph } from "../domain/knowledge-graph.schema.js";
import type {
  Synthesis,
  Section,
  Citation,
} from "../domain/synthesis.schema.js";
import {
  generateOutline as doGenerateOutline,
  generateRelatedQuestions as doGenerateRelatedQuestions,
  extractFindings,
} from "./synthesis-helpers.js";

const SectionContentSchema = z.object({
  content: z.string(),
  summary: z.string().optional(),
  citationIndices: z.array(z.number()),
});

const DEFAULT_OPTIONS: SynthesisOptions = {
  maxSummaryLength: 500,
  maxSectionsCount: 6,
  includeConflicts: true,
  generateRelatedQuestions: true,
  language: "en",
};

export class SynthesizerAdapter implements SynthesizerPort {
  constructor(private llm: LLMPort) {}

  async *synthesize(
    contents: AnalyzedContent[],
    sources: Source[],
    query: ResearchQuery,
    graph?: KnowledgeGraph,
    options?: Partial<SynthesisOptions>,
  ): AsyncGenerator<SynthesisEvent, Synthesis, unknown> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const citations = this.formatCitations(sources);

    const outline = await this.generateOutline(contents, query);
    yield { type: "outline", data: outline };

    const executiveSummary = await this.generateSummary(
      contents,
      opts.maxSummaryLength,
    );
    yield { type: "summary", data: executiveSummary };

    const sections: Section[] = [];
    for (const [index, outlineSection] of outline.entries()) {
      const section = await this.generateSection(
        outlineSection,
        contents,
        sources,
      );
      sections.push({ ...section, order: index });
      yield { type: "section", data: section };
    }

    const keyFindings = await extractFindings(contents);
    yield { type: "findings", data: keyFindings };

    let relatedQuestions: string[] = [];
    if (opts.generateRelatedQuestions) {
      relatedQuestions = await doGenerateRelatedQuestions(
        this.llm,
        query,
        contents,
      );
      yield { type: "questions", data: relatedQuestions };
    }

    const synthesis: Synthesis = {
      executiveSummary,
      keyFindings,
      sections,
      conflicts: [],
      citations,
      relatedQuestions,
      generatedAt: new Date(),
    };

    yield { type: "complete", data: synthesis };
    return synthesis;
  }

  async generateSummary(
    contents: AnalyzedContent[],
    maxLength: number,
  ): Promise<string> {
    const keyPoints = contents.flatMap((c) => c.keyPoints).slice(0, 15);
    const prompt = `Write a concise executive summary (max ${maxLength} words) based on these key findings:

${keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join("\n")}

The summary should:
1. Start with the most important conclusion
2. Cover 3-4 main themes
3. Be written in clear, professional language
4. Include inline citations like [1], [2] where appropriate

Return just the summary text.`;

    try {
      return await this.llm.generateText(prompt);
    } catch {
      return `This research covers ${contents.length} sources on the topic. Key findings include: ${keyPoints.slice(0, 3).join("; ")}.`;
    }
  }

  async generateSection(
    outline: OutlineSection,
    contents: AnalyzedContent[],
    sources: Source[],
  ): Promise<Section> {
    const relevantContents = contents.filter(
      (c) =>
        outline.sourceIds.includes(c.sourceId) ||
        c.topics.some((t) => outline.topics.includes(t)),
    );
    const relevantPoints = relevantContents.flatMap((c) => c.keyPoints);
    const prompt = `Write a detailed section for a research report.

Section Title: ${outline.title}
Topics to cover: ${outline.topics.join(", ")}

Key points from sources:
${relevantPoints.map((p, i) => `[${i + 1}] ${p}`).join("\n")}

Write 2-4 paragraphs that:
1. Synthesize the information coherently
2. Include inline citations [1], [2], etc. referencing the source numbers
3. Present facts and insights clearly
4. Connect related ideas

Return a JSON object with:
- content: the section content with inline citations
- summary: a one-sentence summary (optional)
- citationIndices: array of cited source numbers`;

    try {
      const result = await this.llm.generate(prompt, SectionContentSchema);
      return {
        id: uuid(),
        title: outline.title,
        content: result.data.content,
        summary: result.data.summary,
        citationIds: result.data.citationIndices.map((i) => `[${i}]`),
        media: [],
        subsections: [],
        order: 0,
      };
    } catch {
      return {
        id: uuid(),
        title: outline.title,
        content: `This section covers ${outline.topics.join(", ")} based on ${outline.sourceIds.length} sources.`,
        citationIds: [],
        media: [],
        subsections: [],
        order: 0,
      };
    }
  }

  formatCitations(sources: Source[]): Citation[] {
    return sources.map((source, index) => ({
      id: `[${index + 1}]`,
      sourceId: source.id,
      url: source.url,
      title: source.title,
      domain: source.domain,
      favicon: source.favicon,
      publishedAt: source.publishedAt,
    }));
  }

  async generateOutline(
    contents: AnalyzedContent[],
    query: ResearchQuery,
  ): Promise<OutlineSection[]> {
    return doGenerateOutline(this.llm, contents, query);
  }
}
