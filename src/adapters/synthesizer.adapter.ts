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

const OutlineSchema = z.array(
  z.object({
    title: z.string(),
    topics: z.array(z.string()),
    sourceIndices: z.array(z.number()),
  }),
);

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

    // Generate outline
    const outline = await this.generateOutline(contents, query);
    yield { type: "outline", data: outline };

    // Generate executive summary
    const executiveSummary = await this.generateSummary(
      contents,
      opts.maxSummaryLength,
    );
    yield { type: "summary", data: executiveSummary };

    // Generate sections
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

    // Extract key findings
    const keyFindings = await this.extractFindings(contents);
    yield { type: "findings", data: keyFindings };

    // Generate related questions
    let relatedQuestions: string[] = [];
    if (opts.generateRelatedQuestions) {
      relatedQuestions = await this.generateRelatedQuestions(query, contents);
      yield { type: "questions", data: relatedQuestions };
    }

    // Build final synthesis
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

  async generateOutline(
    contents: AnalyzedContent[],
    query: ResearchQuery,
  ): Promise<OutlineSection[]> {
    const topicsSummary = contents
      .map((c, i) => `Source ${i + 1}: ${c.topics.join(", ")}`)
      .join("\n");

    const keyPointsSummary = contents
      .map((c, i) => `Source ${i + 1}: ${c.keyPoints.slice(0, 3).join("; ")}`)
      .join("\n");

    const prompt = `Create an outline for a research report on: "${query.originalQuery}"

Main topics identified: ${query.mainTopics.join(", ")}

Source topics:
${topicsSummary}

Key points from sources:
${keyPointsSummary}

Create 4-6 logical sections for the report. Each section should:
1. Have a clear, descriptive title
2. Cover related topics
3. Reference which sources are relevant (by index)

Return a JSON array with: title, topics (array), sourceIndices (array of source numbers 0-indexed)`;

    try {
      const result = await this.llm.generate(prompt, OutlineSchema);
      return result.data.map((s) => ({
        title: s.title,
        topics: s.topics,
        sourceIds: s.sourceIndices.map((i) => contents[i]?.sourceId ?? ""),
      }));
    } catch {
      // Fallback outline
      return [
        {
          title: "Overview",
          topics: query.mainTopics,
          sourceIds: contents.slice(0, 3).map((c) => c.sourceId),
        },
        {
          title: "Key Findings",
          topics: ["findings", "insights"],
          sourceIds: contents.map((c) => c.sourceId),
        },
        {
          title: "Analysis",
          topics: ["analysis", "implications"],
          sourceIds: contents.slice(-3).map((c) => c.sourceId),
        },
      ];
    }
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
    // Get relevant content for this section
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

  private async extractFindings(
    contents: AnalyzedContent[],
  ): Promise<import("../domain/synthesis.schema.js").KeyFinding[]> {
    const allKeyPoints = contents.flatMap((c, i) =>
      c.keyPoints.map((kp) => ({ point: kp, sourceIndex: i })),
    );

    // Deduplicate and rank key points
    const uniquePoints = [...new Set(allKeyPoints.map((p) => p.point))];

    return uniquePoints.slice(0, 10).map((point, i) => ({
      id: uuid(),
      finding: point,
      confidence: i < 3 ? "high" : i < 7 ? "medium" : "low",
      citationIds: allKeyPoints
        .filter((p) => p.point === point)
        .map((p) => `[${p.sourceIndex + 1}]`),
    }));
  }

  private async generateRelatedQuestions(
    query: ResearchQuery,
    contents: AnalyzedContent[],
  ): Promise<string[]> {
    const topics = [...new Set(contents.flatMap((c) => c.topics))];

    const prompt = `Based on this research query and findings, suggest 3-5 follow-up questions.

Original query: "${query.originalQuery}"
Topics covered: ${topics.join(", ")}
Main findings: ${contents
      .flatMap((c) => c.keyPoints)
      .slice(0, 5)
      .join("; ")}

Generate questions that:
1. Explore deeper aspects of the topic
2. Address gaps in the current research
3. Investigate related but uncovered areas

Return a JSON array of question strings.`;

    try {
      const result = await this.llm.generate(prompt, z.array(z.string()));
      return result.data.slice(0, 5);
    } catch {
      return [
        `What are the latest developments in ${query.mainTopics[0]}?`,
        `How does ${query.mainTopics[0]} compare to alternatives?`,
        `What are the future implications of these findings?`,
      ];
    }
  }
}
