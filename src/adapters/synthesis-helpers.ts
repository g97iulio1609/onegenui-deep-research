/**
 * Synthesizer - outline, questions, and findings helpers
 */
import { v4 as uuid } from "uuid";
import { z } from "zod";
import type { LLMPort } from "../ports/llm.port.js";
import type { OutlineSection } from "../ports/synthesizer.port.js";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type { ResearchQuery } from "../domain/research-query.schema.js";
import type { KeyFinding } from "../domain/synthesis.schema.js";

const OutlineSchema = z.array(
  z.object({
    title: z.string(),
    topics: z.array(z.string()),
    sourceIndices: z.array(z.number()),
  }),
);

export async function generateOutline(
  llm: LLMPort,
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
    const result = await llm.generate(prompt, OutlineSchema);
    return result.data.map((s) => ({
      title: s.title,
      topics: s.topics,
      sourceIds: s.sourceIndices.map((i) => contents[i]?.sourceId ?? ""),
    }));
  } catch {
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

export async function generateRelatedQuestions(
  llm: LLMPort,
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
    const result = await llm.generate(prompt, z.array(z.string()));
    return result.data.slice(0, 5);
  } catch {
    return [
      `What are the latest developments in ${query.mainTopics[0]}?`,
      `How does ${query.mainTopics[0]} compare to alternatives?`,
      `What are the future implications of these findings?`,
    ];
  }
}

export async function extractFindings(
  contents: AnalyzedContent[],
): Promise<KeyFinding[]> {
  const allKeyPoints = contents.flatMap((c, i) =>
    c.keyPoints.map((kp) => ({ point: kp, sourceIndex: i })),
  );

  const uniquePoints = [...new Set(allKeyPoints.map((p) => p.point))];

  return uniquePoints.slice(0, 10).map((point, i) => ({
    id: uuid(),
    finding: point,
    confidence: i < 3 ? "high" : i < 7 ? "medium" : ("low" as const),
    citationIds: allKeyPoints
      .filter((p) => p.point === point)
      .map((p) => `[${p.sourceIndex + 1}]`),
  }));
}
