import { z } from 'zod';

/**
 * Effort Level Schema - defines research intensity levels
 * Standard: ~3min, Deep: ~10min, Max: ~30min
 */

declare const EffortLevelSchema: z.ZodEnum<["standard", "deep", "max"]>;
type EffortLevel = z.infer<typeof EffortLevelSchema>;
declare const EffortConfigSchema: z.ZodObject<{
    level: z.ZodEnum<["standard", "deep", "max"]>;
    maxSteps: z.ZodNumber;
    timeoutMs: z.ZodNumber;
    maxSources: z.ZodNumber;
    parallelism: z.ZodNumber;
    recursionDepth: z.ZodNumber;
    enableAuth: z.ZodBoolean;
    enableVisualizations: z.ZodBoolean;
    autoStopOnQuality: z.ZodBoolean;
    qualityThreshold: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    level: "standard" | "deep" | "max";
    maxSteps: number;
    timeoutMs: number;
    maxSources: number;
    parallelism: number;
    recursionDepth: number;
    enableAuth: boolean;
    enableVisualizations: boolean;
    autoStopOnQuality: boolean;
    qualityThreshold: number;
}, {
    level: "standard" | "deep" | "max";
    maxSteps: number;
    timeoutMs: number;
    maxSources: number;
    parallelism: number;
    recursionDepth: number;
    enableAuth: boolean;
    enableVisualizations: boolean;
    autoStopOnQuality: boolean;
    qualityThreshold: number;
}>;
type EffortConfig = z.infer<typeof EffortConfigSchema>;
/** Default configurations per effort level */
declare const EFFORT_PRESETS: Record<EffortLevel, EffortConfig>;

/**
 * Source Schema - represents a research source with scoring
 */

declare const SourceTypeSchema: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
type SourceType = z.infer<typeof SourceTypeSchema>;
declare const MediaItemSchema: z.ZodObject<{
    type: z.ZodEnum<["image", "video", "audio", "document"]>;
    url: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "image" | "video" | "audio" | "document";
    url: string;
    title?: string | undefined;
    thumbnail?: string | undefined;
    duration?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
}, {
    type: "image" | "video" | "audio" | "document";
    url: string;
    title?: string | undefined;
    thumbnail?: string | undefined;
    duration?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
}>;
type MediaItem = z.infer<typeof MediaItemSchema>;
declare const SourceSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    snippet: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    domain: z.ZodString;
    favicon: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    author: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
    credibilityScore: z.ZodNumber;
    relevanceScore: z.ZodNumber;
    finalScore: z.ZodOptional<z.ZodNumber>;
    media: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "video", "audio", "document"]>;
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        thumbnail: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">>;
    requiresAuth: z.ZodDefault<z.ZodBoolean>;
    authProvider: z.ZodOptional<z.ZodString>;
    extractedAt: z.ZodOptional<z.ZodDate>;
    wordCount: z.ZodOptional<z.ZodNumber>;
    language: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    credibilityScore: number;
    relevanceScore: number;
    media: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[];
    requiresAuth: boolean;
    snippet?: string | undefined;
    content?: string | undefined;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
    author?: string | undefined;
    finalScore?: number | undefined;
    authProvider?: string | undefined;
    extractedAt?: Date | undefined;
    wordCount?: number | undefined;
    language?: string | undefined;
}, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    credibilityScore: number;
    relevanceScore: number;
    snippet?: string | undefined;
    content?: string | undefined;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
    author?: string | undefined;
    finalScore?: number | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[] | undefined;
    requiresAuth?: boolean | undefined;
    authProvider?: string | undefined;
    extractedAt?: Date | undefined;
    wordCount?: number | undefined;
    language?: string | undefined;
}>;
type Source = z.infer<typeof SourceSchema>;
declare const RankedSourceSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    snippet: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    domain: z.ZodString;
    favicon: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    author: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
    credibilityScore: z.ZodNumber;
    relevanceScore: z.ZodNumber;
    media: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "video", "audio", "document"]>;
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        thumbnail: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">>;
    requiresAuth: z.ZodDefault<z.ZodBoolean>;
    authProvider: z.ZodOptional<z.ZodString>;
    extractedAt: z.ZodOptional<z.ZodDate>;
    wordCount: z.ZodOptional<z.ZodNumber>;
    language: z.ZodOptional<z.ZodString>;
} & {
    rank: z.ZodNumber;
    finalScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    credibilityScore: number;
    relevanceScore: number;
    finalScore: number;
    media: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[];
    requiresAuth: boolean;
    rank: number;
    snippet?: string | undefined;
    content?: string | undefined;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
    author?: string | undefined;
    authProvider?: string | undefined;
    extractedAt?: Date | undefined;
    wordCount?: number | undefined;
    language?: string | undefined;
}, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    credibilityScore: number;
    relevanceScore: number;
    finalScore: number;
    rank: number;
    snippet?: string | undefined;
    content?: string | undefined;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
    author?: string | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[] | undefined;
    requiresAuth?: boolean | undefined;
    authProvider?: string | undefined;
    extractedAt?: Date | undefined;
    wordCount?: number | undefined;
    language?: string | undefined;
}>;
type RankedSource = z.infer<typeof RankedSourceSchema>;

/**
 * Research Query Schema - decomposed query structure
 */

declare const SearchStrategySchema: z.ZodEnum<["broad", "academic", "news", "technical", "social", "official"]>;
type SearchStrategy = z.infer<typeof SearchStrategySchema>;
declare const SubQuerySchema: z.ZodObject<{
    id: z.ZodString;
    query: z.ZodString;
    purpose: z.ZodString;
    strategy: z.ZodEnum<["broad", "academic", "news", "technical", "social", "official"]>;
    priority: z.ZodNumber;
    parentId: z.ZodOptional<z.ZodString>;
    depth: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    depth: number;
    id: string;
    query: string;
    purpose: string;
    strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
    priority: number;
    parentId?: string | undefined;
}, {
    depth: number;
    id: string;
    query: string;
    purpose: string;
    strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
    priority: number;
    parentId?: string | undefined;
}>;
type SubQuery = z.infer<typeof SubQuerySchema>;
declare const ResearchQuerySchema: z.ZodObject<{
    id: z.ZodString;
    originalQuery: z.ZodString;
    refinedQuery: z.ZodOptional<z.ZodString>;
    mainTopics: z.ZodArray<z.ZodString, "many">;
    subQueries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        query: z.ZodString;
        purpose: z.ZodString;
        strategy: z.ZodEnum<["broad", "academic", "news", "technical", "social", "official"]>;
        priority: z.ZodNumber;
        parentId: z.ZodOptional<z.ZodString>;
        depth: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        depth: number;
        id: string;
        query: string;
        purpose: string;
        strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
        priority: number;
        parentId?: string | undefined;
    }, {
        depth: number;
        id: string;
        query: string;
        purpose: string;
        strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
        priority: number;
        parentId?: string | undefined;
    }>, "many">;
    temporalFocus: z.ZodDefault<z.ZodEnum<["recent", "historical", "all", "specific"]>>;
    temporalRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodOptional<z.ZodDate>;
        end: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        start?: Date | undefined;
        end?: Date | undefined;
    }, {
        start?: Date | undefined;
        end?: Date | undefined;
    }>>;
    geographicFocus: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    effort: z.ZodObject<{
        level: z.ZodEnum<["standard", "deep", "max"]>;
        maxSteps: z.ZodNumber;
        timeoutMs: z.ZodNumber;
        maxSources: z.ZodNumber;
        parallelism: z.ZodNumber;
        recursionDepth: z.ZodNumber;
        enableAuth: z.ZodBoolean;
        enableVisualizations: z.ZodBoolean;
        autoStopOnQuality: z.ZodBoolean;
        qualityThreshold: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        level: "standard" | "deep" | "max";
        maxSteps: number;
        timeoutMs: number;
        maxSources: number;
        parallelism: number;
        recursionDepth: number;
        enableAuth: boolean;
        enableVisualizations: boolean;
        autoStopOnQuality: boolean;
        qualityThreshold: number;
    }, {
        level: "standard" | "deep" | "max";
        maxSteps: number;
        timeoutMs: number;
        maxSources: number;
        parallelism: number;
        recursionDepth: number;
        enableAuth: boolean;
        enableVisualizations: boolean;
        autoStopOnQuality: boolean;
        qualityThreshold: number;
    }>;
    context: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    language: string;
    originalQuery: string;
    mainTopics: string[];
    subQueries: {
        depth: number;
        id: string;
        query: string;
        purpose: string;
        strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
        priority: number;
        parentId?: string | undefined;
    }[];
    temporalFocus: "recent" | "historical" | "all" | "specific";
    effort: {
        level: "standard" | "deep" | "max";
        maxSteps: number;
        timeoutMs: number;
        maxSources: number;
        parallelism: number;
        recursionDepth: number;
        enableAuth: boolean;
        enableVisualizations: boolean;
        autoStopOnQuality: boolean;
        qualityThreshold: number;
    };
    createdAt: Date;
    refinedQuery?: string | undefined;
    temporalRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    geographicFocus?: string | undefined;
    context?: string | undefined;
}, {
    id: string;
    originalQuery: string;
    mainTopics: string[];
    subQueries: {
        depth: number;
        id: string;
        query: string;
        purpose: string;
        strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
        priority: number;
        parentId?: string | undefined;
    }[];
    effort: {
        level: "standard" | "deep" | "max";
        maxSteps: number;
        timeoutMs: number;
        maxSources: number;
        parallelism: number;
        recursionDepth: number;
        enableAuth: boolean;
        enableVisualizations: boolean;
        autoStopOnQuality: boolean;
        qualityThreshold: number;
    };
    createdAt: Date;
    language?: string | undefined;
    refinedQuery?: string | undefined;
    temporalFocus?: "recent" | "historical" | "all" | "specific" | undefined;
    temporalRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    geographicFocus?: string | undefined;
    context?: string | undefined;
}>;
type ResearchQuery = z.infer<typeof ResearchQuerySchema>;

/**
 * Knowledge Graph Schema - entities and relationships
 */

declare const EntityTypeSchema: z.ZodEnum<["person", "organization", "location", "concept", "event", "product", "technology", "date", "metric"]>;
type EntityType = z.infer<typeof EntityTypeSchema>;
declare const EntitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["person", "organization", "location", "concept", "event", "product", "technology", "date", "metric"]>;
    description: z.ZodOptional<z.ZodString>;
    aliases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    sourceIds: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
    id: string;
    name: string;
    aliases: string[];
    sourceIds: string[];
    confidence: number;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
    id: string;
    name: string;
    sourceIds: string[];
    confidence: number;
    description?: string | undefined;
    aliases?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
type Entity = z.infer<typeof EntitySchema>;
declare const RelationshipTypeSchema: z.ZodEnum<["related_to", "part_of", "causes", "caused_by", "supports", "contradicts", "precedes", "follows", "located_in", "works_for", "created_by", "competes_with"]>;
type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
declare const RelationshipSchema: z.ZodObject<{
    id: z.ZodString;
    sourceEntityId: z.ZodString;
    targetEntityId: z.ZodString;
    type: z.ZodEnum<["related_to", "part_of", "causes", "caused_by", "supports", "contradicts", "precedes", "follows", "located_in", "works_for", "created_by", "competes_with"]>;
    label: z.ZodOptional<z.ZodString>;
    weight: z.ZodNumber;
    sourceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
    id: string;
    sourceIds: string[];
    sourceEntityId: string;
    targetEntityId: string;
    weight: number;
    label?: string | undefined;
}, {
    type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
    id: string;
    sourceIds: string[];
    sourceEntityId: string;
    targetEntityId: string;
    weight: number;
    label?: string | undefined;
}>;
type Relationship = z.infer<typeof RelationshipSchema>;
declare const KnowledgeGraphSchema: z.ZodObject<{
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["person", "organization", "location", "concept", "event", "product", "technology", "date", "metric"]>;
        description: z.ZodOptional<z.ZodString>;
        aliases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        sourceIds: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
        id: string;
        name: string;
        aliases: string[];
        sourceIds: string[];
        confidence: number;
        description?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
        id: string;
        name: string;
        sourceIds: string[];
        confidence: number;
        description?: string | undefined;
        aliases?: string[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    relationships: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sourceEntityId: z.ZodString;
        targetEntityId: z.ZodString;
        type: z.ZodEnum<["related_to", "part_of", "causes", "caused_by", "supports", "contradicts", "precedes", "follows", "located_in", "works_for", "created_by", "competes_with"]>;
        label: z.ZodOptional<z.ZodString>;
        weight: z.ZodNumber;
        sourceIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
        id: string;
        sourceIds: string[];
        sourceEntityId: string;
        targetEntityId: string;
        weight: number;
        label?: string | undefined;
    }, {
        type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
        id: string;
        sourceIds: string[];
        sourceEntityId: string;
        targetEntityId: string;
        weight: number;
        label?: string | undefined;
    }>, "many">;
    clusters: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        entityIds: z.ZodArray<z.ZodString, "many">;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        entityIds: string[];
        color?: string | undefined;
    }, {
        id: string;
        name: string;
        entityIds: string[];
        color?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entities: {
        type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
        id: string;
        name: string;
        aliases: string[];
        sourceIds: string[];
        confidence: number;
        description?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    relationships: {
        type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
        id: string;
        sourceIds: string[];
        sourceEntityId: string;
        targetEntityId: string;
        weight: number;
        label?: string | undefined;
    }[];
    clusters: {
        id: string;
        name: string;
        entityIds: string[];
        color?: string | undefined;
    }[];
}, {
    entities: {
        type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
        id: string;
        name: string;
        sourceIds: string[];
        confidence: number;
        description?: string | undefined;
        aliases?: string[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    relationships: {
        type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
        id: string;
        sourceIds: string[];
        sourceEntityId: string;
        targetEntityId: string;
        weight: number;
        label?: string | undefined;
    }[];
    clusters: {
        id: string;
        name: string;
        entityIds: string[];
        color?: string | undefined;
    }[];
}>;
type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;
/** MindMap node for hierarchical visualization */
interface MindMapNode {
    id: string;
    label: string;
    description?: string;
    children: MindMapNode[];
    color?: string;
    sourceIds: string[];
}
declare const MindMapNodeSchema: z.ZodType<MindMapNode>;
declare const MindMapSchema: z.ZodObject<{
    root: z.ZodType<MindMapNode, z.ZodTypeDef, MindMapNode>;
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    root: MindMapNode;
}, {
    title: string;
    root: MindMapNode;
}>;
type MindMap = z.infer<typeof MindMapSchema>;

/**
 * Synthesis Schema - report structure with citations
 */

declare const CitationSchema: z.ZodObject<{
    id: z.ZodString;
    sourceId: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    domain: z.ZodString;
    favicon: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceId: string;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
}, {
    url: string;
    title: string;
    id: string;
    domain: string;
    sourceId: string;
    favicon?: string | undefined;
    publishedAt?: Date | undefined;
}>;
type Citation = z.infer<typeof CitationSchema>;
declare const SectionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    citationIds: z.ZodArray<z.ZodString, "many">;
    media: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "video", "audio", "document"]>;
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        thumbnail: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">>;
    subsections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        citationIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        citationIds: string[];
    }, {
        title: string;
        content: string;
        citationIds: string[];
    }>, "many">>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    id: string;
    content: string;
    media: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[];
    citationIds: string[];
    subsections: {
        title: string;
        content: string;
        citationIds: string[];
    }[];
    order: number;
    summary?: string | undefined;
}, {
    title: string;
    id: string;
    content: string;
    citationIds: string[];
    order: number;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[] | undefined;
    summary?: string | undefined;
    subsections?: {
        title: string;
        content: string;
        citationIds: string[];
    }[] | undefined;
}>;
type Section = z.infer<typeof SectionSchema>;
declare const KeyFindingSchema: z.ZodObject<{
    id: z.ZodString;
    finding: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    citationIds: z.ZodArray<z.ZodString, "many">;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    confidence: "high" | "medium" | "low";
    citationIds: string[];
    finding: string;
    category?: string | undefined;
}, {
    id: string;
    confidence: "high" | "medium" | "low";
    citationIds: string[];
    finding: string;
    category?: string | undefined;
}>;
type KeyFinding = z.infer<typeof KeyFindingSchema>;
declare const ConflictSchema: z.ZodObject<{
    id: z.ZodString;
    topic: z.ZodString;
    perspectives: z.ZodArray<z.ZodObject<{
        viewpoint: z.ZodString;
        sourceIds: z.ZodArray<z.ZodString, "many">;
        citationIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        sourceIds: string[];
        citationIds: string[];
        viewpoint: string;
    }, {
        sourceIds: string[];
        citationIds: string[];
        viewpoint: string;
    }>, "many">;
    significance: z.ZodEnum<["high", "medium", "low"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    topic: string;
    perspectives: {
        sourceIds: string[];
        citationIds: string[];
        viewpoint: string;
    }[];
    significance: "high" | "medium" | "low";
}, {
    id: string;
    topic: string;
    perspectives: {
        sourceIds: string[];
        citationIds: string[];
        viewpoint: string;
    }[];
    significance: "high" | "medium" | "low";
}>;
type Conflict = z.infer<typeof ConflictSchema>;
declare const SynthesisSchema: z.ZodObject<{
    executiveSummary: z.ZodString;
    keyFindings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        finding: z.ZodString;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
        citationIds: z.ZodArray<z.ZodString, "many">;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        confidence: "high" | "medium" | "low";
        citationIds: string[];
        finding: string;
        category?: string | undefined;
    }, {
        id: string;
        confidence: "high" | "medium" | "low";
        citationIds: string[];
        finding: string;
        category?: string | undefined;
    }>, "many">;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        summary: z.ZodOptional<z.ZodString>;
        citationIds: z.ZodArray<z.ZodString, "many">;
        media: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "video", "audio", "document"]>;
            url: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            thumbnail: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }>, "many">>;
        subsections: z.ZodDefault<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
            citationIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            title: string;
            content: string;
            citationIds: string[];
        }, {
            title: string;
            content: string;
            citationIds: string[];
        }>, "many">>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        id: string;
        content: string;
        media: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[];
        citationIds: string[];
        subsections: {
            title: string;
            content: string;
            citationIds: string[];
        }[];
        order: number;
        summary?: string | undefined;
    }, {
        title: string;
        id: string;
        content: string;
        citationIds: string[];
        order: number;
        media?: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[] | undefined;
        summary?: string | undefined;
        subsections?: {
            title: string;
            content: string;
            citationIds: string[];
        }[] | undefined;
    }>, "many">;
    conflicts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        topic: z.ZodString;
        perspectives: z.ZodArray<z.ZodObject<{
            viewpoint: z.ZodString;
            sourceIds: z.ZodArray<z.ZodString, "many">;
            citationIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }, {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }>, "many">;
        significance: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        topic: string;
        perspectives: {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }[];
        significance: "high" | "medium" | "low";
    }, {
        id: string;
        topic: string;
        perspectives: {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }[];
        significance: "high" | "medium" | "low";
    }>, "many">>;
    citations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sourceId: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        domain: z.ZodString;
        favicon: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceId: string;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
    }, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceId: string;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
    }>, "many">;
    relatedQuestions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    executiveSummary: string;
    keyFindings: {
        id: string;
        confidence: "high" | "medium" | "low";
        citationIds: string[];
        finding: string;
        category?: string | undefined;
    }[];
    sections: {
        title: string;
        id: string;
        content: string;
        media: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[];
        citationIds: string[];
        subsections: {
            title: string;
            content: string;
            citationIds: string[];
        }[];
        order: number;
        summary?: string | undefined;
    }[];
    conflicts: {
        id: string;
        topic: string;
        perspectives: {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }[];
        significance: "high" | "medium" | "low";
    }[];
    citations: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceId: string;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
    }[];
    relatedQuestions: string[];
    generatedAt: Date;
}, {
    executiveSummary: string;
    keyFindings: {
        id: string;
        confidence: "high" | "medium" | "low";
        citationIds: string[];
        finding: string;
        category?: string | undefined;
    }[];
    sections: {
        title: string;
        id: string;
        content: string;
        citationIds: string[];
        order: number;
        media?: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[] | undefined;
        summary?: string | undefined;
        subsections?: {
            title: string;
            content: string;
            citationIds: string[];
        }[] | undefined;
    }[];
    citations: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceId: string;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
    }[];
    generatedAt: Date;
    conflicts?: {
        id: string;
        topic: string;
        perspectives: {
            sourceIds: string[];
            citationIds: string[];
            viewpoint: string;
        }[];
        significance: "high" | "medium" | "low";
    }[] | undefined;
    relatedQuestions?: string[] | undefined;
}>;
type Synthesis = z.infer<typeof SynthesisSchema>;

declare const ResearchStatusSchema: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
type ResearchStatus = z.infer<typeof ResearchStatusSchema>;
declare const ResearchStatsSchema: z.ZodObject<{
    totalSources: z.ZodNumber;
    sourcesProcessed: z.ZodNumber;
    stepsCompleted: z.ZodNumber;
    totalSteps: z.ZodNumber;
    searchQueries: z.ZodNumber;
    pagesExtracted: z.ZodNumber;
    tokensUsed: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalSources: number;
    sourcesProcessed: number;
    stepsCompleted: number;
    totalSteps: number;
    searchQueries: number;
    pagesExtracted: number;
    durationMs: number;
    tokensUsed?: number | undefined;
}, {
    totalSources: number;
    sourcesProcessed: number;
    stepsCompleted: number;
    totalSteps: number;
    searchQueries: number;
    pagesExtracted: number;
    durationMs: number;
    tokensUsed?: number | undefined;
}>;
type ResearchStats = z.infer<typeof ResearchStatsSchema>;
declare const QualityScoreSchema: z.ZodObject<{
    overall: z.ZodNumber;
    completeness: z.ZodNumber;
    accuracy: z.ZodNumber;
    depth: z.ZodNumber;
    diversity: z.ZodNumber;
    coherence: z.ZodNumber;
    isSOTA: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    completeness: number;
    depth: number;
    diversity: number;
    overall: number;
    accuracy: number;
    coherence: number;
    isSOTA: boolean;
}, {
    completeness: number;
    depth: number;
    diversity: number;
    overall: number;
    accuracy: number;
    coherence: number;
    isSOTA: boolean;
}>;
type QualityScore = z.infer<typeof QualityScoreSchema>;
declare const ChartConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["bar", "line", "area", "pie", "scatter"]>;
    title: z.ZodString;
    data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>, "many">;
    xKey: z.ZodString;
    yKeys: z.ZodArray<z.ZodString, "many">;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "bar" | "line" | "area" | "pie" | "scatter";
    title: string;
    data: Record<string, string | number>[];
    xKey: string;
    yKeys: string[];
    description?: string | undefined;
}, {
    type: "bar" | "line" | "area" | "pie" | "scatter";
    title: string;
    data: Record<string, string | number>[];
    xKey: string;
    yKeys: string[];
    description?: string | undefined;
}>;
type ChartConfig = z.infer<typeof ChartConfigSchema>;
declare const TimelineEventSchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodDate;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sourceIds: z.ZodArray<z.ZodString, "many">;
    importance: z.ZodEnum<["high", "medium", "low"]>;
}, "strip", z.ZodTypeAny, {
    date: Date;
    title: string;
    id: string;
    sourceIds: string[];
    importance: "high" | "medium" | "low";
    description?: string | undefined;
}, {
    date: Date;
    title: string;
    id: string;
    sourceIds: string[];
    importance: "high" | "medium" | "low";
    description?: string | undefined;
}>;
type TimelineEvent = z.infer<typeof TimelineEventSchema>;
declare const ResearchResultSchema: z.ZodObject<{
    id: z.ZodString;
    query: z.ZodObject<{
        id: z.ZodString;
        originalQuery: z.ZodString;
        refinedQuery: z.ZodOptional<z.ZodString>;
        mainTopics: z.ZodArray<z.ZodString, "many">;
        subQueries: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            query: z.ZodString;
            purpose: z.ZodString;
            strategy: z.ZodEnum<["broad", "academic", "news", "technical", "social", "official"]>;
            priority: z.ZodNumber;
            parentId: z.ZodOptional<z.ZodString>;
            depth: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }, {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }>, "many">;
        temporalFocus: z.ZodDefault<z.ZodEnum<["recent", "historical", "all", "specific"]>>;
        temporalRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodDate>;
            end: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            start?: Date | undefined;
            end?: Date | undefined;
        }, {
            start?: Date | undefined;
            end?: Date | undefined;
        }>>;
        geographicFocus: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        effort: z.ZodObject<{
            level: z.ZodEnum<["standard", "deep", "max"]>;
            maxSteps: z.ZodNumber;
            timeoutMs: z.ZodNumber;
            maxSources: z.ZodNumber;
            parallelism: z.ZodNumber;
            recursionDepth: z.ZodNumber;
            enableAuth: z.ZodBoolean;
            enableVisualizations: z.ZodBoolean;
            autoStopOnQuality: z.ZodBoolean;
            qualityThreshold: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        }, {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        }>;
        context: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        language: string;
        originalQuery: string;
        mainTopics: string[];
        subQueries: {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }[];
        temporalFocus: "recent" | "historical" | "all" | "specific";
        effort: {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        };
        createdAt: Date;
        refinedQuery?: string | undefined;
        temporalRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
        geographicFocus?: string | undefined;
        context?: string | undefined;
    }, {
        id: string;
        originalQuery: string;
        mainTopics: string[];
        subQueries: {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }[];
        effort: {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        };
        createdAt: Date;
        language?: string | undefined;
        refinedQuery?: string | undefined;
        temporalFocus?: "recent" | "historical" | "all" | "specific" | undefined;
        temporalRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
        geographicFocus?: string | undefined;
        context?: string | undefined;
    }>;
    status: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
    progress: z.ZodNumber;
    currentPhase: z.ZodString;
    sources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        snippet: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        domain: z.ZodString;
        favicon: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodDate>;
        author: z.ZodOptional<z.ZodString>;
        sourceType: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
        credibilityScore: z.ZodNumber;
        relevanceScore: z.ZodNumber;
        finalScore: z.ZodOptional<z.ZodNumber>;
        media: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "video", "audio", "document"]>;
            url: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            thumbnail: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }>, "many">>;
        requiresAuth: z.ZodDefault<z.ZodBoolean>;
        authProvider: z.ZodOptional<z.ZodString>;
        extractedAt: z.ZodOptional<z.ZodDate>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
        credibilityScore: number;
        relevanceScore: number;
        media: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[];
        requiresAuth: boolean;
        snippet?: string | undefined;
        content?: string | undefined;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
        author?: string | undefined;
        finalScore?: number | undefined;
        authProvider?: string | undefined;
        extractedAt?: Date | undefined;
        wordCount?: number | undefined;
        language?: string | undefined;
    }, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
        credibilityScore: number;
        relevanceScore: number;
        snippet?: string | undefined;
        content?: string | undefined;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
        author?: string | undefined;
        finalScore?: number | undefined;
        media?: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[] | undefined;
        requiresAuth?: boolean | undefined;
        authProvider?: string | undefined;
        extractedAt?: Date | undefined;
        wordCount?: number | undefined;
        language?: string | undefined;
    }>, "many">;
    synthesis: z.ZodOptional<z.ZodObject<{
        executiveSummary: z.ZodString;
        keyFindings: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            finding: z.ZodString;
            confidence: z.ZodEnum<["high", "medium", "low"]>;
            citationIds: z.ZodArray<z.ZodString, "many">;
            category: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }, {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }>, "many">;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            content: z.ZodString;
            summary: z.ZodOptional<z.ZodString>;
            citationIds: z.ZodArray<z.ZodString, "many">;
            media: z.ZodDefault<z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["image", "video", "audio", "document"]>;
                url: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
                thumbnail: z.ZodOptional<z.ZodString>;
                duration: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }, {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }>, "many">>;
            subsections: z.ZodDefault<z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                content: z.ZodString;
                citationIds: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                title: string;
                content: string;
                citationIds: string[];
            }, {
                title: string;
                content: string;
                citationIds: string[];
            }>, "many">>;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id: string;
            content: string;
            media: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[];
            citationIds: string[];
            subsections: {
                title: string;
                content: string;
                citationIds: string[];
            }[];
            order: number;
            summary?: string | undefined;
        }, {
            title: string;
            id: string;
            content: string;
            citationIds: string[];
            order: number;
            media?: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[] | undefined;
            summary?: string | undefined;
            subsections?: {
                title: string;
                content: string;
                citationIds: string[];
            }[] | undefined;
        }>, "many">;
        conflicts: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            topic: z.ZodString;
            perspectives: z.ZodArray<z.ZodObject<{
                viewpoint: z.ZodString;
                sourceIds: z.ZodArray<z.ZodString, "many">;
                citationIds: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }, {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }>, "many">;
            significance: z.ZodEnum<["high", "medium", "low"]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }, {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }>, "many">>;
        citations: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            sourceId: z.ZodString;
            url: z.ZodString;
            title: z.ZodString;
            domain: z.ZodString;
            favicon: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }, {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }>, "many">;
        relatedQuestions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        generatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        executiveSummary: string;
        keyFindings: {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }[];
        sections: {
            title: string;
            id: string;
            content: string;
            media: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[];
            citationIds: string[];
            subsections: {
                title: string;
                content: string;
                citationIds: string[];
            }[];
            order: number;
            summary?: string | undefined;
        }[];
        conflicts: {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }[];
        citations: {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }[];
        relatedQuestions: string[];
        generatedAt: Date;
    }, {
        executiveSummary: string;
        keyFindings: {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }[];
        sections: {
            title: string;
            id: string;
            content: string;
            citationIds: string[];
            order: number;
            media?: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[] | undefined;
            summary?: string | undefined;
            subsections?: {
                title: string;
                content: string;
                citationIds: string[];
            }[] | undefined;
        }[];
        citations: {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }[];
        generatedAt: Date;
        conflicts?: {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }[] | undefined;
        relatedQuestions?: string[] | undefined;
    }>>;
    knowledgeGraph: z.ZodOptional<z.ZodObject<{
        entities: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["person", "organization", "location", "concept", "event", "product", "technology", "date", "metric"]>;
            description: z.ZodOptional<z.ZodString>;
            aliases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            sourceIds: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            aliases: string[];
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            aliases?: string[] | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>, "many">;
        relationships: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            sourceEntityId: z.ZodString;
            targetEntityId: z.ZodString;
            type: z.ZodEnum<["related_to", "part_of", "causes", "caused_by", "supports", "contradicts", "precedes", "follows", "located_in", "works_for", "created_by", "competes_with"]>;
            label: z.ZodOptional<z.ZodString>;
            weight: z.ZodNumber;
            sourceIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }, {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }>, "many">;
        clusters: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            entityIds: z.ZodArray<z.ZodString, "many">;
            color: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }, {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        entities: {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            aliases: string[];
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        relationships: {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }[];
        clusters: {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }[];
    }, {
        entities: {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            aliases?: string[] | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        relationships: {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }[];
        clusters: {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }[];
    }>>;
    mindMap: z.ZodOptional<z.ZodObject<{
        root: z.ZodType<MindMapNode, z.ZodTypeDef, MindMapNode>;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        root: MindMapNode;
    }, {
        title: string;
        root: MindMapNode;
    }>>;
    charts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["bar", "line", "area", "pie", "scatter"]>;
        title: z.ZodString;
        data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>, "many">;
        xKey: z.ZodString;
        yKeys: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "bar" | "line" | "area" | "pie" | "scatter";
        title: string;
        data: Record<string, string | number>[];
        xKey: string;
        yKeys: string[];
        description?: string | undefined;
    }, {
        type: "bar" | "line" | "area" | "pie" | "scatter";
        title: string;
        data: Record<string, string | number>[];
        xKey: string;
        yKeys: string[];
        description?: string | undefined;
    }>, "many">>;
    timeline: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        date: z.ZodDate;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        sourceIds: z.ZodArray<z.ZodString, "many">;
        importance: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        date: Date;
        title: string;
        id: string;
        sourceIds: string[];
        importance: "high" | "medium" | "low";
        description?: string | undefined;
    }, {
        date: Date;
        title: string;
        id: string;
        sourceIds: string[];
        importance: "high" | "medium" | "low";
        description?: string | undefined;
    }>, "many">>;
    quality: z.ZodOptional<z.ZodObject<{
        overall: z.ZodNumber;
        completeness: z.ZodNumber;
        accuracy: z.ZodNumber;
        depth: z.ZodNumber;
        diversity: z.ZodNumber;
        coherence: z.ZodNumber;
        isSOTA: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        completeness: number;
        depth: number;
        diversity: number;
        overall: number;
        accuracy: number;
        coherence: number;
        isSOTA: boolean;
    }, {
        completeness: number;
        depth: number;
        diversity: number;
        overall: number;
        accuracy: number;
        coherence: number;
        isSOTA: boolean;
    }>>;
    stats: z.ZodObject<{
        totalSources: z.ZodNumber;
        sourcesProcessed: z.ZodNumber;
        stepsCompleted: z.ZodNumber;
        totalSteps: z.ZodNumber;
        searchQueries: z.ZodNumber;
        pagesExtracted: z.ZodNumber;
        tokensUsed: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalSources: number;
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        searchQueries: number;
        pagesExtracted: number;
        durationMs: number;
        tokensUsed?: number | undefined;
    }, {
        totalSources: number;
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        searchQueries: number;
        pagesExtracted: number;
        durationMs: number;
        tokensUsed?: number | undefined;
    }>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
    id: string;
    query: {
        id: string;
        language: string;
        originalQuery: string;
        mainTopics: string[];
        subQueries: {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }[];
        temporalFocus: "recent" | "historical" | "all" | "specific";
        effort: {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        };
        createdAt: Date;
        refinedQuery?: string | undefined;
        temporalRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
        geographicFocus?: string | undefined;
        context?: string | undefined;
    };
    progress: number;
    currentPhase: string;
    sources: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
        credibilityScore: number;
        relevanceScore: number;
        media: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[];
        requiresAuth: boolean;
        snippet?: string | undefined;
        content?: string | undefined;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
        author?: string | undefined;
        finalScore?: number | undefined;
        authProvider?: string | undefined;
        extractedAt?: Date | undefined;
        wordCount?: number | undefined;
        language?: string | undefined;
    }[];
    charts: {
        type: "bar" | "line" | "area" | "pie" | "scatter";
        title: string;
        data: Record<string, string | number>[];
        xKey: string;
        yKeys: string[];
        description?: string | undefined;
    }[];
    timeline: {
        date: Date;
        title: string;
        id: string;
        sourceIds: string[];
        importance: "high" | "medium" | "low";
        description?: string | undefined;
    }[];
    stats: {
        totalSources: number;
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        searchQueries: number;
        pagesExtracted: number;
        durationMs: number;
        tokensUsed?: number | undefined;
    };
    startedAt: Date;
    synthesis?: {
        executiveSummary: string;
        keyFindings: {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }[];
        sections: {
            title: string;
            id: string;
            content: string;
            media: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[];
            citationIds: string[];
            subsections: {
                title: string;
                content: string;
                citationIds: string[];
            }[];
            order: number;
            summary?: string | undefined;
        }[];
        conflicts: {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }[];
        citations: {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }[];
        relatedQuestions: string[];
        generatedAt: Date;
    } | undefined;
    knowledgeGraph?: {
        entities: {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            aliases: string[];
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        relationships: {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }[];
        clusters: {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }[];
    } | undefined;
    mindMap?: {
        title: string;
        root: MindMapNode;
    } | undefined;
    quality?: {
        completeness: number;
        depth: number;
        diversity: number;
        overall: number;
        accuracy: number;
        coherence: number;
        isSOTA: boolean;
    } | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
}, {
    status: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
    id: string;
    query: {
        id: string;
        originalQuery: string;
        mainTopics: string[];
        subQueries: {
            depth: number;
            id: string;
            query: string;
            purpose: string;
            strategy: "academic" | "technical" | "news" | "social" | "official" | "broad";
            priority: number;
            parentId?: string | undefined;
        }[];
        effort: {
            level: "standard" | "deep" | "max";
            maxSteps: number;
            timeoutMs: number;
            maxSources: number;
            parallelism: number;
            recursionDepth: number;
            enableAuth: boolean;
            enableVisualizations: boolean;
            autoStopOnQuality: boolean;
            qualityThreshold: number;
        };
        createdAt: Date;
        language?: string | undefined;
        refinedQuery?: string | undefined;
        temporalFocus?: "recent" | "historical" | "all" | "specific" | undefined;
        temporalRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
        geographicFocus?: string | undefined;
        context?: string | undefined;
    };
    progress: number;
    currentPhase: string;
    sources: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
        credibilityScore: number;
        relevanceScore: number;
        snippet?: string | undefined;
        content?: string | undefined;
        favicon?: string | undefined;
        publishedAt?: Date | undefined;
        author?: string | undefined;
        finalScore?: number | undefined;
        media?: {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }[] | undefined;
        requiresAuth?: boolean | undefined;
        authProvider?: string | undefined;
        extractedAt?: Date | undefined;
        wordCount?: number | undefined;
        language?: string | undefined;
    }[];
    stats: {
        totalSources: number;
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        searchQueries: number;
        pagesExtracted: number;
        durationMs: number;
        tokensUsed?: number | undefined;
    };
    startedAt: Date;
    synthesis?: {
        executiveSummary: string;
        keyFindings: {
            id: string;
            confidence: "high" | "medium" | "low";
            citationIds: string[];
            finding: string;
            category?: string | undefined;
        }[];
        sections: {
            title: string;
            id: string;
            content: string;
            citationIds: string[];
            order: number;
            media?: {
                type: "image" | "video" | "audio" | "document";
                url: string;
                title?: string | undefined;
                thumbnail?: string | undefined;
                duration?: number | undefined;
                width?: number | undefined;
                height?: number | undefined;
            }[] | undefined;
            summary?: string | undefined;
            subsections?: {
                title: string;
                content: string;
                citationIds: string[];
            }[] | undefined;
        }[];
        citations: {
            url: string;
            title: string;
            id: string;
            domain: string;
            sourceId: string;
            favicon?: string | undefined;
            publishedAt?: Date | undefined;
        }[];
        generatedAt: Date;
        conflicts?: {
            id: string;
            topic: string;
            perspectives: {
                sourceIds: string[];
                citationIds: string[];
                viewpoint: string;
            }[];
            significance: "high" | "medium" | "low";
        }[] | undefined;
        relatedQuestions?: string[] | undefined;
    } | undefined;
    knowledgeGraph?: {
        entities: {
            type: "date" | "person" | "organization" | "location" | "concept" | "event" | "product" | "technology" | "metric";
            id: string;
            name: string;
            sourceIds: string[];
            confidence: number;
            description?: string | undefined;
            aliases?: string[] | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        relationships: {
            type: "related_to" | "part_of" | "causes" | "caused_by" | "supports" | "contradicts" | "precedes" | "follows" | "located_in" | "works_for" | "created_by" | "competes_with";
            id: string;
            sourceIds: string[];
            sourceEntityId: string;
            targetEntityId: string;
            weight: number;
            label?: string | undefined;
        }[];
        clusters: {
            id: string;
            name: string;
            entityIds: string[];
            color?: string | undefined;
        }[];
    } | undefined;
    mindMap?: {
        title: string;
        root: MindMapNode;
    } | undefined;
    charts?: {
        type: "bar" | "line" | "area" | "pie" | "scatter";
        title: string;
        data: Record<string, string | number>[];
        xKey: string;
        yKeys: string[];
        description?: string | undefined;
    }[] | undefined;
    timeline?: {
        date: Date;
        title: string;
        id: string;
        sourceIds: string[];
        importance: "high" | "medium" | "low";
        description?: string | undefined;
    }[] | undefined;
    quality?: {
        completeness: number;
        depth: number;
        diversity: number;
        overall: number;
        accuracy: number;
        coherence: number;
        isSOTA: boolean;
    } | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
}>;
type ResearchResult = z.infer<typeof ResearchResultSchema>;

/**
 * Research Events - streaming events for progress tracking
 */

declare const BaseEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    researchId: string;
}, {
    timestamp: Date;
    researchId: string;
}>;
declare const PhaseStartedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"phase-started">;
    phase: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "phase-started";
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}, {
    message: string;
    type: "phase-started";
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}>;
declare const PhaseCompletedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"phase-completed">;
    phase: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "phase-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}, {
    type: "phase-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}>;
declare const StepStartedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"step-started">;
    stepId: z.ZodString;
    stepType: z.ZodString;
    description: z.ZodString;
    parallelGroup: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "step-started";
    description: string;
    timestamp: Date;
    researchId: string;
    stepId: string;
    stepType: string;
    parallelGroup?: number | undefined;
}, {
    type: "step-started";
    description: string;
    timestamp: Date;
    researchId: string;
    stepId: string;
    stepType: string;
    parallelGroup?: number | undefined;
}>;
declare const StepCompletedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"step-completed">;
    stepId: z.ZodString;
    success: z.ZodBoolean;
    durationMs: z.ZodNumber;
    resultSummary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "step-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    stepId: string;
    success: boolean;
    resultSummary?: string | undefined;
}, {
    type: "step-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    stepId: string;
    success: boolean;
    resultSummary?: string | undefined;
}>;
declare const SourceFoundEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"source-found">;
    source: z.ZodObject<Pick<{
        id: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        snippet: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        domain: z.ZodString;
        favicon: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodDate>;
        author: z.ZodOptional<z.ZodString>;
        sourceType: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
        credibilityScore: z.ZodNumber;
        relevanceScore: z.ZodNumber;
        finalScore: z.ZodOptional<z.ZodNumber>;
        media: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "video", "audio", "document"]>;
            url: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            thumbnail: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }>, "many">>;
        requiresAuth: z.ZodDefault<z.ZodBoolean>;
        authProvider: z.ZodOptional<z.ZodString>;
        extractedAt: z.ZodOptional<z.ZodDate>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        language: z.ZodOptional<z.ZodString>;
    }, "url" | "title" | "id" | "domain" | "sourceType">, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    }, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "source-found";
    timestamp: Date;
    researchId: string;
    source: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    };
}, {
    type: "source-found";
    timestamp: Date;
    researchId: string;
    source: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    };
}>;
declare const SourceExtractedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"source-extracted">;
    sourceId: z.ZodString;
    wordCount: z.ZodNumber;
    mediaCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "source-extracted";
    wordCount: number;
    sourceId: string;
    timestamp: Date;
    researchId: string;
    mediaCount: number;
}, {
    type: "source-extracted";
    wordCount: number;
    sourceId: string;
    timestamp: Date;
    researchId: string;
    mediaCount: number;
}>;
declare const FindingDiscoveredEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"finding-discovered">;
    finding: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    sourceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "finding-discovered";
    sourceIds: string[];
    confidence: "high" | "medium" | "low";
    finding: string;
    timestamp: Date;
    researchId: string;
}, {
    type: "finding-discovered";
    sourceIds: string[];
    confidence: "high" | "medium" | "low";
    finding: string;
    timestamp: Date;
    researchId: string;
}>;
declare const ProgressUpdateEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"progress-update">;
    progress: z.ZodNumber;
    message: z.ZodString;
    stats: z.ZodObject<{
        sourcesFound: z.ZodNumber;
        sourcesProcessed: z.ZodNumber;
        stepsCompleted: z.ZodNumber;
        totalSteps: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    }, {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "progress-update";
    progress: number;
    stats: {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    };
    timestamp: Date;
    researchId: string;
}, {
    message: string;
    type: "progress-update";
    progress: number;
    stats: {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    };
    timestamp: Date;
    researchId: string;
}>;
declare const QualityCheckEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"quality-check">;
    score: z.ZodNumber;
    isSOTA: z.ZodBoolean;
    shouldStop: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "quality-check";
    isSOTA: boolean;
    timestamp: Date;
    researchId: string;
    score: number;
    shouldStop: boolean;
    reason?: string | undefined;
}, {
    type: "quality-check";
    isSOTA: boolean;
    timestamp: Date;
    researchId: string;
    score: number;
    shouldStop: boolean;
    reason?: string | undefined;
}>;
declare const ErrorEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
    recoverable: z.ZodBoolean;
    stepId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "error";
    error: string;
    timestamp: Date;
    researchId: string;
    recoverable: boolean;
    stepId?: string | undefined;
}, {
    type: "error";
    error: string;
    timestamp: Date;
    researchId: string;
    recoverable: boolean;
    stepId?: string | undefined;
}>;
declare const CompletedEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"completed">;
    totalDurationMs: z.ZodNumber;
    finalQuality: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "completed";
    timestamp: Date;
    researchId: string;
    totalDurationMs: number;
    finalQuality: number;
}, {
    type: "completed";
    timestamp: Date;
    researchId: string;
    totalDurationMs: number;
    finalQuality: number;
}>;
declare const ResearchEventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"phase-started">;
    phase: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "phase-started";
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}, {
    message: string;
    type: "phase-started";
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"phase-completed">;
    phase: z.ZodEnum<["pending", "decomposing", "searching", "ranking", "extracting", "analyzing", "synthesizing", "visualizing", "completed", "failed", "stopped"]>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "phase-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}, {
    type: "phase-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    phase: "pending" | "decomposing" | "searching" | "ranking" | "extracting" | "analyzing" | "synthesizing" | "visualizing" | "completed" | "failed" | "stopped";
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"step-started">;
    stepId: z.ZodString;
    stepType: z.ZodString;
    description: z.ZodString;
    parallelGroup: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "step-started";
    description: string;
    timestamp: Date;
    researchId: string;
    stepId: string;
    stepType: string;
    parallelGroup?: number | undefined;
}, {
    type: "step-started";
    description: string;
    timestamp: Date;
    researchId: string;
    stepId: string;
    stepType: string;
    parallelGroup?: number | undefined;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"step-completed">;
    stepId: z.ZodString;
    success: z.ZodBoolean;
    durationMs: z.ZodNumber;
    resultSummary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "step-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    stepId: string;
    success: boolean;
    resultSummary?: string | undefined;
}, {
    type: "step-completed";
    durationMs: number;
    timestamp: Date;
    researchId: string;
    stepId: string;
    success: boolean;
    resultSummary?: string | undefined;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"source-found">;
    source: z.ZodObject<Pick<{
        id: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        snippet: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        domain: z.ZodString;
        favicon: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodDate>;
        author: z.ZodOptional<z.ZodString>;
        sourceType: z.ZodEnum<["academic", "news", "social", "technical", "official", "general"]>;
        credibilityScore: z.ZodNumber;
        relevanceScore: z.ZodNumber;
        finalScore: z.ZodOptional<z.ZodNumber>;
        media: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "video", "audio", "document"]>;
            url: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            thumbnail: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            type: "image" | "video" | "audio" | "document";
            url: string;
            title?: string | undefined;
            thumbnail?: string | undefined;
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
        }>, "many">>;
        requiresAuth: z.ZodDefault<z.ZodBoolean>;
        authProvider: z.ZodOptional<z.ZodString>;
        extractedAt: z.ZodOptional<z.ZodDate>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        language: z.ZodOptional<z.ZodString>;
    }, "url" | "title" | "id" | "domain" | "sourceType">, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    }, {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "source-found";
    timestamp: Date;
    researchId: string;
    source: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    };
}, {
    type: "source-found";
    timestamp: Date;
    researchId: string;
    source: {
        url: string;
        title: string;
        id: string;
        domain: string;
        sourceType: "academic" | "technical" | "general" | "news" | "social" | "official";
    };
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"source-extracted">;
    sourceId: z.ZodString;
    wordCount: z.ZodNumber;
    mediaCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "source-extracted";
    wordCount: number;
    sourceId: string;
    timestamp: Date;
    researchId: string;
    mediaCount: number;
}, {
    type: "source-extracted";
    wordCount: number;
    sourceId: string;
    timestamp: Date;
    researchId: string;
    mediaCount: number;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"finding-discovered">;
    finding: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    sourceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "finding-discovered";
    sourceIds: string[];
    confidence: "high" | "medium" | "low";
    finding: string;
    timestamp: Date;
    researchId: string;
}, {
    type: "finding-discovered";
    sourceIds: string[];
    confidence: "high" | "medium" | "low";
    finding: string;
    timestamp: Date;
    researchId: string;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"progress-update">;
    progress: z.ZodNumber;
    message: z.ZodString;
    stats: z.ZodObject<{
        sourcesFound: z.ZodNumber;
        sourcesProcessed: z.ZodNumber;
        stepsCompleted: z.ZodNumber;
        totalSteps: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    }, {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "progress-update";
    progress: number;
    stats: {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    };
    timestamp: Date;
    researchId: string;
}, {
    message: string;
    type: "progress-update";
    progress: number;
    stats: {
        sourcesProcessed: number;
        stepsCompleted: number;
        totalSteps: number;
        sourcesFound: number;
    };
    timestamp: Date;
    researchId: string;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"quality-check">;
    score: z.ZodNumber;
    isSOTA: z.ZodBoolean;
    shouldStop: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "quality-check";
    isSOTA: boolean;
    timestamp: Date;
    researchId: string;
    score: number;
    shouldStop: boolean;
    reason?: string | undefined;
}, {
    type: "quality-check";
    isSOTA: boolean;
    timestamp: Date;
    researchId: string;
    score: number;
    shouldStop: boolean;
    reason?: string | undefined;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
    recoverable: z.ZodBoolean;
    stepId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "error";
    error: string;
    timestamp: Date;
    researchId: string;
    recoverable: boolean;
    stepId?: string | undefined;
}, {
    type: "error";
    error: string;
    timestamp: Date;
    researchId: string;
    recoverable: boolean;
    stepId?: string | undefined;
}>, z.ZodObject<{
    timestamp: z.ZodDate;
    researchId: z.ZodString;
} & {
    type: z.ZodLiteral<"completed">;
    totalDurationMs: z.ZodNumber;
    finalQuality: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "completed";
    timestamp: Date;
    researchId: string;
    totalDurationMs: number;
    finalQuality: number;
}, {
    type: "completed";
    timestamp: Date;
    researchId: string;
    totalDurationMs: number;
    finalQuality: number;
}>]>;
type ResearchEvent = z.infer<typeof ResearchEventSchema>;
type PhaseStartedEvent = z.infer<typeof PhaseStartedEventSchema>;
type StepStartedEvent = z.infer<typeof StepStartedEventSchema>;
type ProgressUpdateEvent = z.infer<typeof ProgressUpdateEventSchema>;
type QualityCheckEvent = z.infer<typeof QualityCheckEventSchema>;

/**
 * Deep Search Port - interface for search operations
 */

interface SearchOptions {
    maxResults: number;
    timeout: number;
    strategy: SearchStrategy;
    language?: string;
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    excludeDomains?: string[];
    includeDomains?: string[];
}
interface SearchResult {
    query: string;
    sources: Omit<Source, "content" | "extractedAt">[];
    totalFound: number;
    durationMs: number;
}
interface SearchProgress {
    query: string;
    status: "pending" | "searching" | "completed" | "failed";
    progress: number;
    resultsFound: number;
}
/**
 * Port for web search operations
 * Implementations: Crawl4AI (no browser), SearXNG, Brave, etc.
 */
interface DeepSearchPort {
    /** Execute a single search query */
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    /** Execute multiple queries in parallel with concurrency control */
    searchParallel(queries: SubQuery[], options: SearchOptions, onProgress?: (progress: SearchProgress) => void): AsyncGenerator<SearchResult, void, unknown>;
    /** Check if the search service is available */
    isAvailable(): Promise<boolean>;
    /** Get the name of this search provider */
    getName(): string;
}

/**
 * Content Scraper Port - lightweight content extraction without browser
 */

interface ScrapeOptions {
    timeout: number;
    extractMedia: boolean;
    maxContentLength?: number;
    followRedirects?: boolean;
    userAgent?: string;
}
interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    excerpt: string;
    author?: string;
    publishedAt?: Date;
    media: MediaItem[];
    wordCount: number;
    language?: string;
    success: boolean;
    error?: string;
    durationMs: number;
}
interface ScrapeProgress {
    url: string;
    status: "pending" | "fetching" | "extracting" | "completed" | "failed";
    progress: number;
}
/**
 * Port for content scraping - NO BROWSER required
 * Uses HTTP requests + HTML parsing for max performance
 */
interface ContentScraperPort {
    /** Scrape content from a single URL */
    scrape(url: string, options: ScrapeOptions): Promise<ScrapedContent>;
    /** Scrape multiple URLs with concurrency control */
    scrapeMany(urls: string[], options: ScrapeOptions, onProgress?: (progress: ScrapeProgress) => void): AsyncGenerator<ScrapedContent, void, unknown>;
    /** Check if URL is likely scrapeable without browser */
    canScrapeWithoutBrowser(url: string): boolean;
    /** Get supported domains for optimized scraping */
    getSupportedDomains(): string[];
}

/**
 * Content Analyzer Port - entity extraction and analysis
 */

interface AnalysisContext {
    query: string;
    topics: string[];
    sourceId: string;
}
interface AnalyzedContent {
    sourceId: string;
    entities: Entity[];
    keyPoints: string[];
    claims: Claim[];
    sentiment?: "positive" | "negative" | "neutral";
    topics: string[];
    quality: ContentQuality;
}
interface Claim {
    id: string;
    statement: string;
    confidence: number;
    sourceId: string;
    evidence: string;
}
interface ContentQuality {
    relevance: number;
    factualDensity: number;
    clarity: number;
    overall: number;
}
/**
 * Port for content analysis using LLM
 */
interface ContentAnalyzerPort {
    /** Analyze content and extract structured data */
    analyze(content: string, context: AnalysisContext): Promise<AnalyzedContent>;
    /** Extract named entities from content */
    extractEntities(content: string): Promise<Entity[]>;
    /** Extract relationships between entities */
    extractRelationships(content: string, entities: Entity[]): Promise<Relationship[]>;
    /** Detect conflicting claims across multiple contents */
    detectConflicts(contents: AnalyzedContent[]): Promise<Conflict[]>;
    /** Extract key findings from analyzed content */
    extractKeyFindings(contents: AnalyzedContent[]): Promise<KeyFinding[]>;
}

/**
 * Source Ranker Port - intelligent source ranking
 */

interface RankingCriteria {
    query: string;
    topics: string[];
    preferRecent: boolean;
    preferredTypes?: SourceType[];
    excludedDomains?: string[];
}
interface RankingWeights {
    credibility: number;
    relevance: number;
    recency: number;
    diversity: number;
    depth: number;
}
declare const DEFAULT_RANKING_WEIGHTS: RankingWeights;
/**
 * Port for source ranking and selection
 */
interface SourceRankerPort {
    /** Rank sources by quality and relevance */
    rank(sources: Source[], criteria: RankingCriteria): Promise<RankedSource[]>;
    /** Filter sources by minimum credibility */
    filterByCredibility(sources: Source[], minScore: number): Source[];
    /** Diversify sources to avoid clustering from same domain */
    diversify(sources: Source[], maxPerDomain: number): Source[];
    /** Get credibility score for a domain */
    getCredibilityScore(domain: string): number;
    /** Update ranking weights */
    setWeights(weights: Partial<RankingWeights>): void;
}

/**
 * Knowledge Graph Port - build and manipulate knowledge graphs
 */

interface GraphBuildOptions {
    minEntityConfidence: number;
    minRelationshipWeight: number;
    maxNodes: number;
    clusterByTopic: boolean;
}
declare const DEFAULT_GRAPH_OPTIONS: GraphBuildOptions;
/**
 * Port for knowledge graph operations
 */
interface KnowledgeGraphPort {
    /** Build knowledge graph from analyzed content */
    build(contents: AnalyzedContent[], options?: Partial<GraphBuildOptions>): Promise<KnowledgeGraph>;
    /** Merge multiple graphs into one */
    merge(graphs: KnowledgeGraph[]): KnowledgeGraph;
    /** Find connections for a specific entity */
    findConnections(entityId: string, graph: KnowledgeGraph, depth?: number): {
        entities: Entity[];
        relationships: Relationship[];
    };
    /** Convert graph to hierarchical mind map */
    toMindMap(graph: KnowledgeGraph, rootTopic: string): MindMap;
    /** Get most central/important entities */
    getCentralEntities(graph: KnowledgeGraph, limit: number): Entity[];
}

/**
 * Synthesizer Port - report generation with streaming
 */

interface SynthesisOptions {
    maxSummaryLength: number;
    maxSectionsCount: number;
    includeConflicts: boolean;
    generateRelatedQuestions: boolean;
    language: string;
}
declare const DEFAULT_SYNTHESIS_OPTIONS: SynthesisOptions;
interface SynthesisEvent {
    type: "outline" | "summary" | "section" | "findings" | "questions" | "complete";
    data: unknown;
}
interface OutlineSection {
    title: string;
    topics: string[];
    sourceIds: string[];
}
/**
 * Port for report synthesis with streaming support
 */
interface SynthesizerPort {
    /** Generate complete synthesis with streaming events */
    synthesize(contents: AnalyzedContent[], sources: Source[], query: ResearchQuery, graph?: KnowledgeGraph, options?: Partial<SynthesisOptions>): AsyncGenerator<SynthesisEvent, Synthesis, unknown>;
    /** Generate outline for report structure */
    generateOutline(contents: AnalyzedContent[], query: ResearchQuery): Promise<OutlineSection[]>;
    /** Generate executive summary */
    generateSummary(contents: AnalyzedContent[], maxLength: number): Promise<string>;
    /** Generate a single section */
    generateSection(outline: OutlineSection, contents: AnalyzedContent[], sources: Source[]): Promise<Section>;
    /** Format citations for bibliography */
    formatCitations(sources: Source[]): Citation[];
}

/**
 * LLM Port - interface for language model operations
 */

interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
}
interface LLMResponse<T> {
    data: T;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
/**
 * Port for LLM operations with structured output
 */
interface LLMPort {
    /** Generate structured output using a Zod schema */
    generate<T>(prompt: string, schema: z.ZodType<T>, options?: LLMOptions): Promise<LLMResponse<T>>;
    /** Generate text without structured output */
    generateText(prompt: string, options?: LLMOptions): Promise<string>;
    /** Stream text generation */
    streamText(prompt: string, options?: LLMOptions): AsyncGenerator<string, void, unknown>;
    /** Get embedding for text */
    embed(text: string): Promise<number[]>;
    /** Calculate semantic similarity between texts */
    similarity(text1: string, text2: string): Promise<number>;
}

interface OrchestratorPorts {
    search: DeepSearchPort;
    scraper: ContentScraperPort;
    analyzer: ContentAnalyzerPort;
    ranker: SourceRankerPort;
    graph: KnowledgeGraphPort;
    synthesizer: SynthesizerPort;
    llm: LLMPort;
}
interface OrchestratorConfig {
    effort: EffortConfig;
    abortSignal?: AbortSignal;
}
declare class ResearchOrchestrator {
    private ports;
    private config;
    private state;
    private decomposer;
    private parallelLimit;
    constructor(ports: OrchestratorPorts, config: OrchestratorConfig);
    execute(queryText: string, context?: string): AsyncGenerator<ResearchEvent, ResearchResult, unknown>;
    private executeSearchPhase;
    private executeRankingPhase;
    private executeExtractionPhase;
    private executeAnalysisPhase;
    private executeRecursiveSearch;
    private executeSynthesisPhase;
    private executeVisualizationPhase;
    private assessQuality;
    private calculateDiversity;
    private shouldStop;
    private initState;
    private calculateTotalSteps;
    private batchQueries;
    private batchArray;
    private phaseStarted;
    private phaseCompleted;
    private progressUpdate;
    private qualityCheck;
    private buildResult;
}

/**
 * MCP Tools for Deep Research
 */

declare const DeepResearchInputSchema: z.ZodObject<{
    query: z.ZodString;
    effort: z.ZodDefault<z.ZodEnum<["standard", "deep", "max"]>>;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    effort: "standard" | "deep" | "max";
    context?: string | undefined;
}, {
    query: string;
    effort?: "standard" | "deep" | "max" | undefined;
    context?: string | undefined;
}>;
type DeepResearchInput = z.infer<typeof DeepResearchInputSchema>;
/**
 * Tool definition for deep research
 * Can be adapted to any MCP implementation
 */
interface DeepResearchTool {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: "string";
                description: string;
            };
            effort: {
                type: "string";
                enum: string[];
                default: string;
                description: string;
            };
            context: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
    execute: (input: DeepResearchInput, options?: {
        onProgress?: (p: {
            progress?: number;
            message?: string;
        }) => void;
        signal?: AbortSignal;
    }) => Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
}
declare function createDeepResearchTools(ports: OrchestratorPorts): DeepResearchTool[];

export { SubQuerySchema as $, type AnalysisContext as A, type LLMResponse as B, type ContentScraperPort as C, type DeepSearchPort as D, type EffortLevel as E, type OrchestratorPorts as F, type GraphBuildOptions as G, type ResearchEvent as H, type ResearchResult as I, createDeepResearchTools as J, type KeyFinding as K, type LLMPort as L, type MindMap as M, EffortLevelSchema as N, type OutlineSection as O, EFFORT_PRESETS as P, EffortConfigSchema as Q, type RankingWeights as R, type ScrapeOptions as S, SourceTypeSchema as T, type SourceType as U, MediaItemSchema as V, type MediaItem as W, SourceSchema as X, RankedSourceSchema as Y, SearchStrategySchema as Z, type SearchStrategy as _, type EffortConfig as a, ResearchQuerySchema as a0, EntityTypeSchema as a1, type EntityType as a2, EntitySchema as a3, RelationshipTypeSchema as a4, type RelationshipType as a5, RelationshipSchema as a6, KnowledgeGraphSchema as a7, type MindMapNode as a8, MindMapNodeSchema as a9, QualityCheckEventSchema as aA, ErrorEventSchema as aB, CompletedEventSchema as aC, ResearchEventSchema as aD, type PhaseStartedEvent as aE, type StepStartedEvent as aF, type ProgressUpdateEvent as aG, type QualityCheckEvent as aH, type Claim as aI, type ContentQuality as aJ, DEFAULT_RANKING_WEIGHTS as aK, DEFAULT_GRAPH_OPTIONS as aL, DEFAULT_SYNTHESIS_OPTIONS as aM, ResearchOrchestrator as aN, type OrchestratorConfig as aO, DeepResearchInputSchema as aP, type DeepResearchInput as aQ, type DeepResearchTool as aR, MindMapSchema as aa, CitationSchema as ab, SectionSchema as ac, KeyFindingSchema as ad, ConflictSchema as ae, SynthesisSchema as af, ResearchStatusSchema as ag, type ResearchStatus as ah, ResearchStatsSchema as ai, type ResearchStats as aj, QualityScoreSchema as ak, type QualityScore as al, ChartConfigSchema as am, type ChartConfig as an, TimelineEventSchema as ao, type TimelineEvent as ap, ResearchResultSchema as aq, BaseEventSchema as ar, PhaseStartedEventSchema as as, PhaseCompletedEventSchema as at, StepStartedEventSchema as au, StepCompletedEventSchema as av, SourceFoundEventSchema as aw, SourceExtractedEventSchema as ax, FindingDiscoveredEventSchema as ay, ProgressUpdateEventSchema as az, type ScrapedContent as b, type ScrapeProgress as c, type SearchOptions as d, type SearchResult as e, type SubQuery as f, type SearchProgress as g, type SourceRankerPort as h, type Source as i, type RankingCriteria as j, type RankedSource as k, type ContentAnalyzerPort as l, type AnalyzedContent as m, type Entity as n, type Relationship as o, type Conflict as p, type SynthesizerPort as q, type ResearchQuery as r, type KnowledgeGraph as s, type SynthesisOptions as t, type SynthesisEvent as u, type Synthesis as v, type Section as w, type Citation as x, type KnowledgeGraphPort as y, type LLMOptions as z };
