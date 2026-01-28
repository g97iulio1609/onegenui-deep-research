/**
 * Knowledge Graph Schema - entities and relationships
 */
import { z } from "zod";

export const EntityTypeSchema = z.enum([
  "person",
  "organization",
  "location",
  "concept",
  "event",
  "product",
  "technology",
  "date",
  "metric",
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: EntityTypeSchema,
  description: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  sourceIds: z.array(z.string().uuid()), // Sources mentioning this entity
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipTypeSchema = z.enum([
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
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  type: RelationshipTypeSchema,
  label: z.string().optional(),
  weight: z.number().min(0).max(1),
  sourceIds: z.array(z.string().uuid()),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const KnowledgeGraphSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  clusters: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      entityIds: z.array(z.string().uuid()),
      color: z.string().optional(),
    }),
  ),
});
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

/** MindMap node for hierarchical visualization */
export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  children: MindMapNode[];
  color?: string;
  sourceIds: string[];
}

export const MindMapNodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    label: z.string(),
    description: z.string().optional(),
    children: z.array(MindMapNodeSchema).default([]),
    color: z.string().optional(),
    sourceIds: z.array(z.string().uuid()).default([]),
  }),
) as z.ZodType<MindMapNode>;

export const MindMapSchema = z.object({
  root: MindMapNodeSchema,
  title: z.string(),
});
export type MindMap = z.infer<typeof MindMapSchema>;
