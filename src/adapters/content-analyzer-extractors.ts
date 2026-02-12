import { v4 as uuid } from "uuid";
import { z } from "zod";
import type { LLMPort } from "../ports/llm.port.js";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type { Entity, Relationship } from "../domain/knowledge-graph.schema.js";
import type { Conflict, KeyFinding } from "../domain/synthesis.schema.js";
const EntitySchema = z.array(
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
);
const RelationshipResultSchema = z.array(
  z.object({
    sourceEntity: z.string(),
    targetEntity: z.string(),
    type: z.enum([
      "related_to",
      "part_of",
      "causes",
      "caused_by",
      "supports",
      "contradicts",
      "precedes",
      "follows",
      "located_in",
      "works_for",
      "created_by",
      "competes_with",
    ]),
    label: z.string().optional(),
  }),
);
const ConflictSchema = z.array(
  z.object({
    topic: z.string(),
    perspectives: z.array(
      z.object({
        viewpoint: z.string(),
        sourceIndices: z.array(z.number()),
      }),
    ),
    significance: z.enum(["high", "medium", "low"]),
  }),
);
const KeyFindingsSchema = z.array(
  z.object({
    finding: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    sourceIndices: z.array(z.number()),
    category: z.string().optional(),
  }),
);
export async function extractEntities(
  llm: LLMPort,
  content: string,
): Promise<Entity[]> {
  const prompt = `Extract all named entities from this content. Include people, organizations, locations, concepts, events, products, technologies, dates, and metrics.
CONTENT:
${content.slice(0, 10000)}
Return a JSON array of entities with: name, type, description (optional).`;
  try {
    const result = await llm.generate(prompt, EntitySchema);
    return result.data.map((e) => ({
      id: uuid(),
      name: e.name,
      type: e.type,
      description: e.description,
      aliases: [],
      sourceIds: [],
      confidence: 0.75,
    }));
  } catch {
    return [];
  }
}
export async function extractRelationships(
  llm: LLMPort,
  content: string,
  entities: Entity[],
): Promise<Relationship[]> {
  if (entities.length < 2) return [];
  const entityNames = entities.map((e) => e.name).join(", ");
  const prompt = `Given these entities: ${entityNames}
Find relationships between them in this content:
${content.slice(0, 50000)}
Return a JSON array of relationships with:
- sourceEntity: name of source entity
- targetEntity: name of target entity
- type: one of [related_to, part_of, causes, caused_by, supports, contradicts, precedes, follows, located_in, works_for, created_by, competes_with]
- label: brief description of the relationship`;
  try {
    const result = await llm.generate(prompt, RelationshipResultSchema);
    const entityMap = new Map(entities.map((e) => [e.name.toLowerCase(), e]));
    const relationships: Relationship[] = [];
    for (const r of result.data) {
      const source = entityMap.get(r.sourceEntity.toLowerCase());
      const target = entityMap.get(r.targetEntity.toLowerCase());
      if (!source || !target) continue;
      relationships.push({
        id: uuid(),
        sourceEntityId: source.id,
        targetEntityId: target.id,
        type: r.type,
        label: r.label,
        weight: 0.7,
        sourceIds: [],
      });
    }
    return relationships;
  } catch {
    return [];
  }
}
export async function detectConflicts(
  llm: LLMPort,
  contents: AnalyzedContent[],
): Promise<Conflict[]> {
  if (contents.length < 2) return [];
  const claimsSummary = contents
    .map(
      (c, i) =>
        `Source ${i + 1} claims:\n${c.claims.map((cl) => `- ${cl.statement}`).join("\n")}`,
    )
    .join("\n\n");
  const prompt = `Analyze these claims from different sources and identify any conflicts or contradictions:

${claimsSummary}

Find topics where sources disagree or present conflicting information.
Return a JSON array of conflicts with:
- topic: the subject of disagreement
- perspectives: array of {viewpoint, sourceIndices} showing different views
- significance: high/medium/low based on importance`;
  try {
    const result = await llm.generate(prompt, ConflictSchema);
    return result.data.map((c) => ({
      id: uuid(),
      topic: c.topic,
      perspectives: c.perspectives.map((p) => ({
        viewpoint: p.viewpoint,
        sourceIds: p.sourceIndices.map((i) => contents[i]?.sourceId ?? ""),
        citationIds: [],
      })),
      significance: c.significance,
    }));
  } catch {
    return [];
  }
}
export async function extractKeyFindings(
  llm: LLMPort,
  contents: AnalyzedContent[],
): Promise<KeyFinding[]> {
  const keyPointsSummary = contents
    .map(
      (c, i) =>
        `Source ${i + 1} key points:\n${c.keyPoints.map((kp) => `- ${kp}`).join("\n")}`,
    )
    .join("\n\n");
  const prompt = `Synthesize the most important findings from these sources:

${keyPointsSummary}

Identify the top 5-10 key findings that are:
1. Well-supported by multiple sources
2. Most relevant and impactful
3. Novel or insightful
Return a JSON array with:
- finding: the key finding statement
- confidence: high/medium/low based on source support
- sourceIndices: which sources support this finding
- category: optional category (e.g., "trend", "fact", "insight")`;
  try {
    const result = await llm.generate(prompt, KeyFindingsSchema);
    return result.data.map((f) => ({
      id: uuid(),
      finding: f.finding,
      confidence: f.confidence,
      citationIds: f.sourceIndices.map((i) => `[${i + 1}]`),
      category: f.category,
    }));
  } catch {
    return [];
  }
}
