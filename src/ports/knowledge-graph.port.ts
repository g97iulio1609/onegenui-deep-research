/**
 * Knowledge Graph Port - build and manipulate knowledge graphs
 */
import type {
  KnowledgeGraph,
  Entity,
  Relationship,
  MindMap,
} from "../domain/knowledge-graph.schema.js";
import type { AnalyzedContent } from "./content-analyzer.port.js";

export interface GraphBuildOptions {
  minEntityConfidence: number;
  minRelationshipWeight: number;
  maxNodes: number;
  clusterByTopic: boolean;
}

export const DEFAULT_GRAPH_OPTIONS: GraphBuildOptions = {
  minEntityConfidence: 0.6,
  minRelationshipWeight: 0.4,
  maxNodes: 100,
  clusterByTopic: true,
};

/**
 * Port for knowledge graph operations
 */
export interface KnowledgeGraphPort {
  /** Build knowledge graph from analyzed content */
  build(
    contents: AnalyzedContent[],
    options?: Partial<GraphBuildOptions>,
  ): Promise<KnowledgeGraph>;

  /** Merge multiple graphs into one */
  merge(graphs: KnowledgeGraph[]): KnowledgeGraph;

  /** Find connections for a specific entity */
  findConnections(
    entityId: string,
    graph: KnowledgeGraph,
    depth?: number,
  ): {
    entities: Entity[];
    relationships: Relationship[];
  };

  /** Convert graph to hierarchical mind map */
  toMindMap(graph: KnowledgeGraph, rootTopic: string): MindMap;

  /** Get most central/important entities */
  getCentralEntities(graph: KnowledgeGraph, limit: number): Entity[];
}
