import { v4 as uuid } from "uuid";
import type {
  KnowledgeGraphPort,
  GraphBuildOptions,
  DEFAULT_GRAPH_OPTIONS,
} from "../ports/knowledge-graph.port.js";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type {
  KnowledgeGraph,
  Entity,
  Relationship,
  MindMap,
} from "../domain/knowledge-graph.schema.js";
import { createClusters, buildMindMapNode } from "./graph-builders.js";

const DEFAULT_OPTIONS: GraphBuildOptions = {
  minEntityConfidence: 0.6,
  minRelationshipWeight: 0.4,
  maxNodes: 100,
  clusterByTopic: true,
};

export class KnowledgeGraphAdapter implements KnowledgeGraphPort {
  async build(
    contents: AnalyzedContent[],
    options?: Partial<GraphBuildOptions>,
  ): Promise<KnowledgeGraph> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const entityMap = new Map<string, Entity>();
    for (const content of contents) {
      for (const entity of content.entities) {
        if (entity.confidence < opts.minEntityConfidence) continue;
        const key = entity.name.toLowerCase();
        if (entityMap.has(key)) {
          const existing = entityMap.get(key)!;
          existing.sourceIds = [
            ...new Set([...existing.sourceIds, ...entity.sourceIds]),
          ];
          existing.confidence = Math.max(
            existing.confidence,
            entity.confidence,
          );
        } else {
          entityMap.set(key, { ...entity });
        }
      }
    }
    let entities = Array.from(entityMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, opts.maxNodes);
    const relationships: Relationship[] = [];
    const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));
    for (const content of contents) {
      const contentEntities = content.entities.filter((e) =>
        entityNames.has(e.name.toLowerCase()),
      );
      for (let i = 0; i < contentEntities.length; i++) {
        for (let j = i + 1; j < contentEntities.length; j++) {
          const sourceEntity = entityMap.get(
            contentEntities[i].name.toLowerCase(),
          );
          const targetEntity = entityMap.get(
            contentEntities[j].name.toLowerCase(),
          );
          if (sourceEntity && targetEntity) {
            relationships.push({
              id: uuid(),
              sourceEntityId: sourceEntity.id,
              targetEntityId: targetEntity.id,
              type: "related_to",
              weight: 0.5,
              sourceIds: [content.sourceId],
            });
          }
        }
      }
    }
    const relationshipMap = new Map<string, Relationship>();
    for (const rel of relationships) {
      const key = `${rel.sourceEntityId}-${rel.targetEntityId}`;
      if (relationshipMap.has(key)) {
        const existing = relationshipMap.get(key)!;
        existing.weight = Math.min(1, existing.weight + 0.1);
        existing.sourceIds = [
          ...new Set([...existing.sourceIds, ...rel.sourceIds]),
        ];
      } else {
        relationshipMap.set(key, rel);
      }
    }
    const filteredRelationships = Array.from(relationshipMap.values()).filter(
      (r) => r.weight >= opts.minRelationshipWeight,
    );
    const clusters = opts.clusterByTopic
      ? createClusters(entities, contents)
      : [];

    return {
      entities,
      relationships: filteredRelationships,
      clusters,
    };
  }

  merge(graphs: KnowledgeGraph[]): KnowledgeGraph {
    const entityMap = new Map<string, Entity>();
    const relationshipMap = new Map<string, Relationship>();
    for (const graph of graphs) {
      for (const entity of graph.entities) {
        const key = entity.name.toLowerCase();
        if (!entityMap.has(key)) entityMap.set(key, entity);
        else {
          const existing = entityMap.get(key)!;
          existing.sourceIds = [
            ...new Set([...existing.sourceIds, ...entity.sourceIds]),
          ];
        }
      }
      for (const rel of graph.relationships) {
        const key = `${rel.sourceEntityId}-${rel.targetEntityId}`;
        if (!relationshipMap.has(key)) relationshipMap.set(key, rel);
      }
    }
    return {
      entities: Array.from(entityMap.values()),
      relationships: Array.from(relationshipMap.values()),
      clusters: [],
    };
  }
  findConnections(
    entityId: string,
    graph: KnowledgeGraph,
    depth = 1,
  ): { entities: Entity[]; relationships: Relationship[] } {
    const connectedEntityIds = new Set<string>([entityId]);
    const connectedRelationships: Relationship[] = [];
    for (let d = 0; d < depth; d++) {
      for (const rel of graph.relationships) {
        if (connectedEntityIds.has(rel.sourceEntityId)) {
          connectedEntityIds.add(rel.targetEntityId);
          connectedRelationships.push(rel);
        }
        if (connectedEntityIds.has(rel.targetEntityId)) {
          connectedEntityIds.add(rel.sourceEntityId);
          connectedRelationships.push(rel);
        }
      }
    }
    const entities = graph.entities.filter((e) => connectedEntityIds.has(e.id));
    return {
      entities,
      relationships: connectedRelationships,
    };
  }
  toMindMap(graph: KnowledgeGraph, rootTopic: string): MindMap {
    const rootEntity =
      graph.entities.find(
        (e) => e.name.toLowerCase() === rootTopic.toLowerCase(),
      ) ||
      graph.entities.find((e) => e.type === "concept") ||
      graph.entities[0];
    if (!rootEntity) {
      return {
        title: rootTopic,
        root: {
          id: uuid(),
          label: rootTopic,
          children: [],
          sourceIds: [],
        },
      };
    }
    const root = buildMindMapNode(rootEntity, graph, new Set());
    return {
      title: rootTopic,
      root,
    };
  }
  getCentralEntities(graph: KnowledgeGraph, limit: number): Entity[] {
    const centrality = new Map<string, number>();
    for (const entity of graph.entities) {
      centrality.set(entity.id, 0);
    }
    for (const rel of graph.relationships) {
      centrality.set(
        rel.sourceEntityId,
        (centrality.get(rel.sourceEntityId) || 0) + rel.weight,
      );
      centrality.set(
        rel.targetEntityId,
        (centrality.get(rel.targetEntityId) || 0) + rel.weight,
      );
    }
    return graph.entities
      .sort((a, b) => (centrality.get(b.id) || 0) - (centrality.get(a.id) || 0))
      .slice(0, limit);
  }
}
