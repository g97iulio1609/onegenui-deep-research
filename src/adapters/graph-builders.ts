/**
 * Knowledge Graph - cluster and mind map builders
 */
import { v4 as uuid } from "uuid";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type {
  KnowledgeGraph,
  Entity,
  MindMapNode,
} from "../domain/knowledge-graph.schema.js";

export function createClusters(
  entities: Entity[],
  contents: AnalyzedContent[],
): KnowledgeGraph["clusters"] {
  const topicEntityMap = new Map<string, Set<string>>();

  for (const content of contents) {
    for (const topic of content.topics) {
      if (!topicEntityMap.has(topic)) {
        topicEntityMap.set(topic, new Set());
      }
      for (const entity of content.entities) {
        topicEntityMap.get(topic)!.add(entity.id);
      }
    }
  }

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
  ];

  return Array.from(topicEntityMap.entries())
    .slice(0, 6)
    .map(([topic, entityIds], i) => ({
      id: uuid(),
      name: topic,
      entityIds: Array.from(entityIds),
      color: colors[i % colors.length],
    }));
}

export function buildMindMapNode(
  entity: Entity,
  graph: KnowledgeGraph,
  visited: Set<string>,
  depth = 0,
): MindMapNode {
  if (visited.has(entity.id) || depth > 3) {
    return {
      id: entity.id,
      label: entity.name,
      description: entity.description,
      children: [],
      sourceIds: entity.sourceIds,
    };
  }

  visited.add(entity.id);

  const connectedIds = new Set<string>();
  for (const rel of graph.relationships) {
    if (rel.sourceEntityId === entity.id) {
      connectedIds.add(rel.targetEntityId);
    }
    if (rel.targetEntityId === entity.id) {
      connectedIds.add(rel.sourceEntityId);
    }
  }

  const children = graph.entities
    .filter((e) => connectedIds.has(e.id) && !visited.has(e.id))
    .slice(0, 5)
    .map((e) => buildMindMapNode(e, graph, visited, depth + 1));

  return {
    id: entity.id,
    label: entity.name,
    description: entity.description,
    children,
    sourceIds: entity.sourceIds,
  };
}
