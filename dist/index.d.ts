import { z } from 'zod';
import { E as EffortLevel, a as EffortConfig, C as ContentScraperPort, S as ScrapeOptions, b as ScrapedContent, c as ScrapeProgress, D as DeepSearchPort, d as SearchOptions, e as SearchResult, f as SubQuery, g as SearchProgress, h as SourceRankerPort, R as RankingWeights, i as Source, j as RankingCriteria, k as RankedSource, l as ContentAnalyzerPort, L as LLMPort, A as AnalysisContext, m as AnalyzedContent, n as Entity, o as Relationship, p as Conflict, K as KeyFinding, q as SynthesizerPort, r as ResearchQuery, s as KnowledgeGraph, t as SynthesisOptions, u as SynthesisEvent, v as Synthesis, O as OutlineSection, w as Section, x as Citation, y as KnowledgeGraphPort, G as GraphBuildOptions, M as MindMap, z as LLMOptions, B as LLMResponse, V as VectorlessKnowledgeBasePort, F as VectorlessDocument, H as VectorlessIndexOptions, I as VectorlessQueryOptions, J as VectorlessQueryResult, N as OrchestratorPorts, P as ResearchEvent, Q as ResearchResult } from './tools-Os-MXEVl.js';
export { aw as BaseEventSchema, as as ChartConfig, ar as ChartConfigSchema, ag as CitationSchema, aN as Claim, aH as CompletedEventSchema, aj as ConflictSchema, aO as ContentQuality, aQ as DEFAULT_GRAPH_OPTIONS, aP as DEFAULT_RANKING_WEIGHTS, aR as DEFAULT_SYNTHESIS_OPTIONS, W as EFFORT_PRESETS, X as EffortConfigSchema, U as EffortLevelSchema, a8 as EntitySchema, a7 as EntityType, a6 as EntityTypeSchema, aG as ErrorEventSchema, aD as FindingDiscoveredEventSchema, ai as KeyFindingSchema, ac as KnowledgeGraphSchema, $ as MediaItem, _ as MediaItemSchema, ad as MindMapNode, ae as MindMapNodeSchema, af as MindMapSchema, aT as OrchestratorConfig, ay as PhaseCompletedEventSchema, aJ as PhaseStartedEvent, ax as PhaseStartedEventSchema, aL as ProgressUpdateEvent, aE as ProgressUpdateEventSchema, aM as QualityCheckEvent, aF as QualityCheckEventSchema, aq as QualityScore, ap as QualityScoreSchema, a1 as RankedSourceSchema, ab as RelationshipSchema, aa as RelationshipType, a9 as RelationshipTypeSchema, aI as ResearchEventSchema, aS as ResearchOrchestrator, a5 as ResearchQuerySchema, av as ResearchResultSchema, ao as ResearchStats, an as ResearchStatsSchema, am as ResearchStatus, al as ResearchStatusSchema, a3 as SearchStrategy, a2 as SearchStrategySchema, ah as SectionSchema, aC as SourceExtractedEventSchema, aB as SourceFoundEventSchema, a0 as SourceSchema, Z as SourceType, Y as SourceTypeSchema, aA as StepCompletedEventSchema, aK as StepStartedEvent, az as StepStartedEventSchema, a4 as SubQuerySchema, ak as SynthesisSchema, au as TimelineEvent, at as TimelineEventSchema, T as createDeepResearchTools } from './tools-Os-MXEVl.js';
import * as ai from 'ai';
import { LanguageModel, embed, ToolLoopAgent } from 'ai';

/**
 * Deep Research Configuration - Single Source of Truth
 *
 * Centralizes all configurable values to eliminate duplication
 * and enable future configuration from external sources.
 */

declare const ResearchPhaseSchema: z.ZodEnum<["query-decomposition", "source-discovery", "content-extraction", "analysis", "synthesis", "visualization"]>;
type ResearchPhase = z.infer<typeof ResearchPhaseSchema>;
interface PhaseConfig {
    id: ResearchPhase;
    label: string;
    weight: number;
    icon: string;
}
declare const RESEARCH_PHASES: readonly PhaseConfig[];
interface TimingConfig {
    estimatedMinutes: number;
    displayLabel: string;
}
declare const EFFORT_TIMING: Record<EffortLevel, TimingConfig>;
declare const QualityScoringWeightsSchema: z.ZodObject<{
    completeness: z.ZodNumber;
    depth: z.ZodNumber;
    diversity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    completeness: number;
    depth: number;
    diversity: number;
}, {
    completeness: number;
    depth: number;
    diversity: number;
}>;
type QualityScoringWeights = z.infer<typeof QualityScoringWeightsSchema>;
declare const DEFAULT_SCORING_WEIGHTS: QualityScoringWeights;
declare const CredibilityTierSchema: z.ZodEnum<["academic", "government", "major-news", "technical", "general"]>;
type CredibilityTier = z.infer<typeof CredibilityTierSchema>;
interface CredibilityConfig {
    domains: string[];
    score: number;
}
declare const CREDIBILITY_TIERS: Record<CredibilityTier, CredibilityConfig>;
declare const JS_REQUIRED_DOMAINS: readonly string[];
declare const ScrapingConfigSchema: z.ZodObject<{
    maxConcurrent: z.ZodNumber;
    timeoutMs: z.ZodNumber;
    maxContentLength: z.ZodNumber;
    cacheTtlMs: z.ZodNumber;
    maxPerDomain: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timeoutMs: number;
    maxConcurrent: number;
    maxContentLength: number;
    cacheTtlMs: number;
    maxPerDomain: number;
}, {
    timeoutMs: number;
    maxConcurrent: number;
    maxContentLength: number;
    cacheTtlMs: number;
    maxPerDomain: number;
}>;
type ScrapingConfig = z.infer<typeof ScrapingConfigSchema>;
declare const DEFAULT_SCRAPING_CONFIG: ScrapingConfig;
declare const SearchConfigSchema: z.ZodObject<{
    maxResultsPerQuery: z.ZodNumber;
    cacheTtlMs: z.ZodNumber;
    retryAttempts: z.ZodNumber;
    retryDelayMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    cacheTtlMs: number;
    maxResultsPerQuery: number;
    retryAttempts: number;
    retryDelayMs: number;
}, {
    cacheTtlMs: number;
    maxResultsPerQuery: number;
    retryAttempts: number;
    retryDelayMs: number;
}>;
type SearchConfig = z.infer<typeof SearchConfigSchema>;
declare const DEFAULT_SEARCH_CONFIG: SearchConfig;
interface ResearchConfig {
    effort: EffortConfig;
    timing: TimingConfig;
    phases: readonly PhaseConfig[];
    scoring: QualityScoringWeights;
    scraping: ScrapingConfig;
    search: SearchConfig;
}
/**
 * Get complete configuration for an effort level
 */
declare function getResearchConfig(level: EffortLevel): ResearchConfig;
/**
 * Get credibility score for a domain
 */
declare function getDomainCredibility(domain: string): number;
/**
 * Check if a domain requires JavaScript for content extraction
 */
declare function requiresJavaScript(domain: string): boolean;

/**
 * Authentication Domain Schemas
 *
 * Types for managing authenticated access to premium sources
 */

declare const AuthMethodSchema: z.ZodEnum<["cookie", "oauth", "api_key", "browser_session"]>;
type AuthMethod = z.infer<typeof AuthMethodSchema>;
declare const PlatformSchema: z.ZodEnum<["google_scholar", "pubmed", "semantic_scholar", "arxiv", "twitter", "linkedin", "reddit", "bloomberg", "reuters", "medium", "substack", "custom"]>;
type Platform = z.infer<typeof PlatformSchema>;
declare const CredentialSchema: z.ZodObject<{
    id: z.ZodString;
    platform: z.ZodEnum<["google_scholar", "pubmed", "semantic_scholar", "arxiv", "twitter", "linkedin", "reddit", "bloomberg", "reuters", "medium", "substack", "custom"]>;
    method: z.ZodEnum<["cookie", "oauth", "api_key", "browser_session"]>;
    label: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    expiresAt: z.ZodOptional<z.ZodDate>;
    isValid: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    platform: "custom" | "medium" | "google_scholar" | "pubmed" | "semantic_scholar" | "arxiv" | "twitter" | "linkedin" | "reddit" | "bloomberg" | "reuters" | "substack";
    method: "cookie" | "oauth" | "api_key" | "browser_session";
    isValid: boolean;
    label?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    id: string;
    createdAt: Date;
    platform: "custom" | "medium" | "google_scholar" | "pubmed" | "semantic_scholar" | "arxiv" | "twitter" | "linkedin" | "reddit" | "bloomberg" | "reuters" | "substack";
    method: "cookie" | "oauth" | "api_key" | "browser_session";
    isValid: boolean;
    label?: string | undefined;
    expiresAt?: Date | undefined;
}>;
type Credential = z.infer<typeof CredentialSchema>;
declare const CookieCredentialSchema: z.ZodObject<{
    domain: z.ZodString;
    cookies: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
        domain: z.ZodString;
        path: z.ZodDefault<z.ZodString>;
        expires: z.ZodOptional<z.ZodNumber>;
        httpOnly: z.ZodOptional<z.ZodBoolean>;
        secure: z.ZodOptional<z.ZodBoolean>;
        sameSite: z.ZodOptional<z.ZodEnum<["Strict", "Lax", "None"]>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        path: string;
        domain: string;
        name: string;
        expires?: number | undefined;
        httpOnly?: boolean | undefined;
        secure?: boolean | undefined;
        sameSite?: "Strict" | "Lax" | "None" | undefined;
    }, {
        value: string;
        domain: string;
        name: string;
        path?: string | undefined;
        expires?: number | undefined;
        httpOnly?: boolean | undefined;
        secure?: boolean | undefined;
        sameSite?: "Strict" | "Lax" | "None" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    domain: string;
    cookies: {
        value: string;
        path: string;
        domain: string;
        name: string;
        expires?: number | undefined;
        httpOnly?: boolean | undefined;
        secure?: boolean | undefined;
        sameSite?: "Strict" | "Lax" | "None" | undefined;
    }[];
}, {
    domain: string;
    cookies: {
        value: string;
        domain: string;
        name: string;
        path?: string | undefined;
        expires?: number | undefined;
        httpOnly?: boolean | undefined;
        secure?: boolean | undefined;
        sameSite?: "Strict" | "Lax" | "None" | undefined;
    }[];
}>;
type CookieCredential = z.infer<typeof CookieCredentialSchema>;
declare const OAuthTokenSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenType: z.ZodDefault<z.ZodString>;
    expiresIn: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    scope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    tokenType: string;
    expiresAt?: Date | undefined;
    refreshToken?: string | undefined;
    expiresIn?: number | undefined;
    scope?: string | undefined;
}, {
    accessToken: string;
    expiresAt?: Date | undefined;
    refreshToken?: string | undefined;
    tokenType?: string | undefined;
    expiresIn?: number | undefined;
    scope?: string | undefined;
}>;
type OAuthToken = z.infer<typeof OAuthTokenSchema>;
declare const OAuthConfigSchema: z.ZodObject<{
    clientId: z.ZodString;
    clientSecret: z.ZodOptional<z.ZodString>;
    authorizationUrl: z.ZodString;
    tokenUrl: z.ZodString;
    redirectUri: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    authorizationUrl: string;
    tokenUrl: string;
    redirectUri: string;
    scope?: string | undefined;
    clientSecret?: string | undefined;
}, {
    clientId: string;
    authorizationUrl: string;
    tokenUrl: string;
    redirectUri: string;
    scope?: string | undefined;
    clientSecret?: string | undefined;
}>;
type OAuthConfig = z.infer<typeof OAuthConfigSchema>;
declare const ApiKeyCredentialSchema: z.ZodObject<{
    apiKey: z.ZodString;
    headerName: z.ZodDefault<z.ZodString>;
    headerPrefix: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    headerName: string;
    headerPrefix: string;
}, {
    apiKey: string;
    headerName?: string | undefined;
    headerPrefix?: string | undefined;
}>;
type ApiKeyCredential = z.infer<typeof ApiKeyCredentialSchema>;
declare const AuthSessionSchema: z.ZodObject<{
    platform: z.ZodEnum<["google_scholar", "pubmed", "semantic_scholar", "arxiv", "twitter", "linkedin", "reddit", "bloomberg", "reuters", "medium", "substack", "custom"]>;
    isAuthenticated: z.ZodBoolean;
    lastChecked: z.ZodDate;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    platform: "custom" | "medium" | "google_scholar" | "pubmed" | "semantic_scholar" | "arxiv" | "twitter" | "linkedin" | "reddit" | "bloomberg" | "reuters" | "substack";
    isAuthenticated: boolean;
    lastChecked: Date;
    error?: string | undefined;
}, {
    platform: "custom" | "medium" | "google_scholar" | "pubmed" | "semantic_scholar" | "arxiv" | "twitter" | "linkedin" | "reddit" | "bloomberg" | "reuters" | "substack";
    isAuthenticated: boolean;
    lastChecked: Date;
    error?: string | undefined;
}>;
type AuthSession = z.infer<typeof AuthSessionSchema>;
interface PlatformAuthConfig {
    platform: Platform;
    displayName: string;
    description: string;
    supportedMethods: AuthMethod[];
    requiredForPremium: boolean;
    domains: string[];
    icon?: string;
}
declare const PLATFORM_AUTH_CONFIGS: Record<Platform, PlatformAuthConfig>;

/**
 * Auth Port - Interface for authentication management
 *
 * Defines the contract for authenticating with various platforms
 */

interface AuthPort {
    /**
     * Check if a platform has valid credentials
     */
    isAuthenticated(platform: Platform): Promise<boolean>;
    /**
     * Get auth session state for a platform
     */
    getSession(platform: Platform): Promise<AuthSession | null>;
    /**
     * Get all configured credentials (metadata only, no secrets)
     */
    listCredentials(): Promise<Credential[]>;
    /**
     * Add or update credentials for a platform
     */
    setCredential(platform: Platform, method: AuthMethod, credential: CookieCredential | OAuthToken | ApiKeyCredential): Promise<void>;
    /**
     * Remove credentials for a platform
     */
    removeCredential(platform: Platform): Promise<void>;
    /**
     * Validate current credentials are still working
     */
    validateCredential(platform: Platform): Promise<boolean>;
    /**
     * Get request headers for authenticated requests
     */
    getAuthHeaders(platform: Platform): Promise<Record<string, string>>;
    /**
     * Get cookies for authenticated requests
     */
    getAuthCookies(domain: string): Promise<string | null>;
}
interface CookieAuthPort {
    /**
     * Import cookies from browser export (Netscape format)
     */
    importFromNetscapeFormat(cookieFile: string): Promise<CookieCredential>;
    /**
     * Import cookies from JSON format
     */
    importFromJson(cookieJson: string): Promise<CookieCredential>;
    /**
     * Get cookie header string for a domain
     */
    getCookieHeader(domain: string): Promise<string | null>;
    /**
     * Validate cookies are still valid for a domain
     */
    validateCookies(domain: string): Promise<boolean>;
}
interface OAuthPort {
    /**
     * Get authorization URL for OAuth flow
     */
    getAuthorizationUrl(platform: Platform): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCode(platform: Platform, code: string): Promise<OAuthToken>;
    /**
     * Refresh access token
     */
    refreshToken(platform: Platform): Promise<OAuthToken>;
    /**
     * Revoke access
     */
    revokeAccess(platform: Platform): Promise<void>;
}
interface BrowserSessionPort {
    /**
     * Check if browser session is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Scrape a page using browser session (for JS-required sites)
     */
    scrapePage(url: string): Promise<{
        html: string;
        title: string;
        cookies: CookieCredential["cookies"];
    }>;
    /**
     * Extract cookies from browser for a domain
     */
    extractCookies(domain: string): Promise<CookieCredential["cookies"]>;
}

declare class LightweightScraperAdapter implements ContentScraperPort {
    private cache;
    private concurrencyLimit;
    private config;
    constructor(config?: Partial<ScrapingConfig>);
    scrape(url: string, options: ScrapeOptions): Promise<ScrapedContent>;
    scrapeMany(urls: string[], options: ScrapeOptions, onProgress?: (progress: ScrapeProgress) => void): AsyncGenerator<ScrapedContent, void, unknown>;
    canScrapeWithoutBrowser(url: string): boolean;
    getSupportedDomains(): string[];
    private fetchWithTimeout;
    private parseHtml;
    private extractMainContent;
    private extractMedia;
    private resolveUrl;
    private getCacheKey;
    private getRandomUserAgent;
    private errorResult;
}

interface SearchAdapterConfig {
    maxConcurrency?: number;
    defaultTimeout?: number;
}
declare class DeepSearchAdapter implements DeepSearchPort {
    private cache;
    private concurrencyLimit;
    private defaultTimeout;
    constructor(config?: SearchAdapterConfig);
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    searchParallel(queries: SubQuery[], options: SearchOptions, onProgress?: (progress: SearchProgress) => void): AsyncGenerator<SearchResult, void, unknown>;
    isAvailable(): Promise<boolean>;
    getName(): string;
    private buildSearchQuery;
    private executeSearch;
    private parseDuckDuckGoResults;
    private cleanUrl;
    private cleanText;
    private toSource;
    private estimateCredibility;
    private getCacheKey;
}

/**
 * Source Ranker Adapter - intelligent ranking implementation
 */

declare class SourceRankerAdapter implements SourceRankerPort {
    private weights;
    constructor(weights?: Partial<RankingWeights>);
    rank(sources: Source[], criteria: RankingCriteria): Promise<RankedSource[]>;
    filterByCredibility(sources: Source[], minScore: number): Source[];
    diversify(sources: Source[], maxPerDomain: number): Source[];
    getCredibilityScore(domain: string): number;
    setWeights(weights: Partial<RankingWeights>): void;
    private calculateRelevance;
    private calculateRecency;
    private calculateDepth;
}

declare class ContentAnalyzerAdapter implements ContentAnalyzerPort {
    private llm;
    constructor(llm: LLMPort);
    analyze(content: string, context: AnalysisContext): Promise<AnalyzedContent>;
    extractEntities(content: string): Promise<Entity[]>;
    extractRelationships(content: string, entities: Entity[]): Promise<Relationship[]>;
    detectConflicts(contents: AnalyzedContent[]): Promise<Conflict[]>;
    extractKeyFindings(contents: AnalyzedContent[]): Promise<KeyFinding[]>;
}

declare class SynthesizerAdapter implements SynthesizerPort {
    private llm;
    constructor(llm: LLMPort);
    synthesize(contents: AnalyzedContent[], sources: Source[], query: ResearchQuery, graph?: KnowledgeGraph, options?: Partial<SynthesisOptions>): AsyncGenerator<SynthesisEvent, Synthesis, unknown>;
    generateOutline(contents: AnalyzedContent[], query: ResearchQuery): Promise<OutlineSection[]>;
    generateSummary(contents: AnalyzedContent[], maxLength: number): Promise<string>;
    generateSection(outline: OutlineSection, contents: AnalyzedContent[], sources: Source[]): Promise<Section>;
    formatCitations(sources: Source[]): Citation[];
    private extractFindings;
    private generateRelatedQuestions;
}

declare class KnowledgeGraphAdapter implements KnowledgeGraphPort {
    build(contents: AnalyzedContent[], options?: Partial<GraphBuildOptions>): Promise<KnowledgeGraph>;
    merge(graphs: KnowledgeGraph[]): KnowledgeGraph;
    findConnections(entityId: string, graph: KnowledgeGraph, depth?: number): {
        entities: Entity[];
        relationships: Relationship[];
    };
    toMindMap(graph: KnowledgeGraph, rootTopic: string): MindMap;
    getCentralEntities(graph: KnowledgeGraph, limit: number): Entity[];
    private createClusters;
    private buildMindMapNode;
}

/**
 * Cookie Auth Adapter
 *
 * Manages cookie-based authentication for platforms that require login
 * Supports importing cookies from browser exports
 */

declare class CookieAuthAdapter implements CookieAuthPort {
    /**
     * Import cookies from Netscape format (common browser export)
     * Format: domain\tinclude_subdomains\tpath\tsecure\texpires\tname\tvalue
     */
    importFromNetscapeFormat(cookieFile: string): Promise<CookieCredential>;
    /**
     * Import cookies from JSON format
     */
    importFromJson(cookieJson: string): Promise<CookieCredential>;
    /**
     * Get cookie header string for a domain
     */
    getCookieHeader(domain: string): Promise<string | null>;
    /**
     * Validate cookies are still valid for a domain
     */
    validateCookies(domain: string): Promise<boolean>;
    /**
     * Store credentials directly
     */
    storeCredential(credential: CookieCredential): void;
    /**
     * Remove credentials for a domain
     */
    removeCredential(domain: string): void;
    /**
     * List all stored domains
     */
    listDomains(): string[];
}

/**
 * API Key Auth Adapter
 *
 * Manages API key-based authentication for services like
 * PubMed, Semantic Scholar, Reddit, etc.
 */

declare class ApiKeyAuthAdapter {
    /**
     * Store API key for a platform
     */
    setApiKey(platform: Platform, apiKey: string): void;
    /**
     * Get API key credential for a platform
     */
    getCredential(platform: Platform): ApiKeyCredential | null;
    /**
     * Get auth headers for a platform
     */
    getAuthHeaders(platform: Platform): Record<string, string> | null;
    /**
     * Check if platform has API key configured
     */
    hasApiKey(platform: Platform): boolean;
    /**
     * Remove API key for a platform
     */
    removeApiKey(platform: Platform): void;
    /**
     * Validate API key works (platform-specific)
     */
    validateApiKey(platform: Platform): Promise<boolean>;
    /**
     * List all platforms with API keys
     */
    listPlatforms(): Platform[];
}

/**
 * Auth Manager Adapter
 *
 * Unified authentication manager that coordinates between different auth methods
 */

declare class AuthManagerAdapter implements AuthPort {
    private cookieAuth;
    private apiKeyAuth;
    constructor();
    isAuthenticated(platform: Platform): Promise<boolean>;
    getSession(platform: Platform): Promise<AuthSession | null>;
    listCredentials(): Promise<Credential[]>;
    setCredential(platform: Platform, method: AuthMethod, credential: CookieCredential | OAuthToken | ApiKeyCredential): Promise<void>;
    removeCredential(platform: Platform): Promise<void>;
    validateCredential(platform: Platform): Promise<boolean>;
    getAuthHeaders(platform: Platform): Promise<Record<string, string>>;
    getAuthCookies(domain: string): Promise<string | null>;
    getCookieAdapter(): CookieAuthAdapter;
    getApiKeyAdapter(): ApiKeyAuthAdapter;
}
declare function getAuthManager(): AuthManagerAdapter;

/**
 * Academic Search Adapter
 *
 * Provides access to academic sources:
 * - Semantic Scholar (API with optional key)
 * - arXiv (open access)
 * - PubMed (API with optional key)
 */

declare class AcademicSearchAdapter implements DeepSearchPort {
    private apiKeyAuth;
    constructor(apiKeyAuth?: ApiKeyAuthAdapter);
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    searchParallel(queries: SubQuery[], options: SearchOptions, onProgress?: (progress: SearchProgress) => void): AsyncGenerator<SearchResult, void, unknown>;
    isAvailable(): Promise<boolean>;
    getName(): string;
    private searchSemanticScholar;
    private searchArxiv;
    private parseArxivXml;
    private mapPaperToSource;
    private calculateAcademicCredibility;
}

/**
 * News Search Adapter
 *
 * Searches news sources for current events and recent information
 * Uses public RSS feeds and news aggregators
 */

declare class NewsSearchAdapter implements DeepSearchPort {
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    searchParallel(queries: SubQuery[], options: SearchOptions, onProgress?: (progress: SearchProgress) => void): AsyncGenerator<SearchResult, void, unknown>;
    isAvailable(): Promise<boolean>;
    getName(): string;
    private searchGoogleNews;
    private parseRssXml;
    private extractDomainFromSource;
    private estimateNewsCredibility;
}

/**
 * AI SDK LLM Adapter - bridges deep-research to Vercel AI SDK 6
 * Uses generateText with Output.object() for structured data
 */

interface AiSdkLlmAdapterOptions {
    model: LanguageModel;
    embeddingModel?: Parameters<typeof embed>[0]["model"];
}
declare class AiSdkLlmAdapter implements LLMPort {
    private options;
    constructor(options: AiSdkLlmAdapterOptions);
    generate<T>(prompt: string, schema: z.ZodType<T>, options?: LLMOptions): Promise<LLMResponse<T>>;
    generateText(prompt: string, options?: LLMOptions): Promise<string>;
    streamText(prompt: string, options?: LLMOptions): AsyncGenerator<string, void, unknown>;
    embed(text: string): Promise<number[]>;
    similarity(text1: string, text2: string): Promise<number>;
    private cosineSimilarity;
}

/**
 * Vectorless Knowledge Base Adapter
 *
 * Integrates scraped content with vectorless for comprehensive report generation.
 * Uses in-memory storage for research session with semantic chunking.
 */

declare class VectorlessKnowledgeBaseAdapter implements VectorlessKnowledgeBasePort {
    private llm;
    private chunks;
    private documents;
    private enabled;
    constructor(llm: LLMPort, options?: {
        enabled?: boolean;
    });
    isEnabled(): boolean;
    indexDocuments(documents: VectorlessDocument[], options?: VectorlessIndexOptions): Promise<{
        indexed: number;
        failed: number;
    }>;
    query(query: string, options?: VectorlessQueryOptions): Promise<VectorlessQueryResult[]>;
    generateReport(query: string, context: {
        findings: string[];
        sources: {
            url: string;
            title: string;
        }[];
        topics: string[];
    }): AsyncGenerator<{
        type: "chunk" | "complete";
        content: string;
    }>;
    clear(sessionId: string): Promise<void>;
    private chunkContent;
    private calculateRelevance;
}

declare class QueryDecomposer {
    private llm;
    constructor(llm: LLMPort);
    decompose(query: string, effort: EffortConfig, context?: string): Promise<ResearchQuery>;
    private getSubQueryCount;
    private buildPrompt;
}

/**
 * Deep Research Use Case - main entry point
 */

interface DeepResearchOptions$1 {
    effort: EffortLevel;
    customConfig?: Partial<EffortConfig>;
    context?: string;
    abortSignal?: AbortSignal;
    /** Enable vectorless knowledge base integration for comprehensive reports */
    useVectorless?: boolean;
}
declare class DeepResearchUseCase {
    private ports;
    constructor(ports: OrchestratorPorts);
    /**
     * Execute deep research on a query
     * Yields progress events and returns final result
     */
    research(query: string, options: DeepResearchOptions$1): AsyncGenerator<ResearchEvent, ResearchResult, unknown>;
    /**
     * Quick research - returns result without streaming events
     */
    researchQuick(query: string, options: Omit<DeepResearchOptions$1, "effort">): Promise<ResearchResult>;
    private buildEffortConfig;
}

interface DeepResearchAgentOptions {
    model: LanguageModel;
    effort: EffortLevel;
    onProgress?: (event: ResearchEvent) => void;
    abortSignal?: AbortSignal;
    maxTokens?: number;
}
interface DeepResearchAgentResult {
    synthesis: string;
    sources: Array<{
        url: string;
        title: string;
        domain: string;
        snippet?: string;
    }>;
    stats: {
        totalSources: number;
        sourcesProcessed: number;
        durationMs: number;
    };
    quality: number;
}
/**
 * Create a deep research agent using ToolLoopAgent
 */
declare function createDeepResearchAgent(options: DeepResearchAgentOptions): {
    agent: ToolLoopAgent<never, {
        webSearch: ai.Tool<{
            query: string;
            searchType: "news" | "web";
        }, {
            found: number;
            sources: {
                title: string;
                url: string;
                snippet: string;
            }[];
            error?: undefined;
        } | {
            found: number;
            sources: never[];
            error: string;
        }>;
        scrapeContent: ai.Tool<{
            url: string;
        }, {
            success: boolean;
            title: string;
            wordCount: number;
            excerpt: string;
            error?: undefined;
        } | {
            success: boolean;
            error: string;
            title?: undefined;
            wordCount?: undefined;
            excerpt?: undefined;
        }>;
        recordFinding: ai.Tool<{
            finding: string;
            source?: string | undefined;
        }, {
            recorded: boolean;
            totalFindings: number;
        }>;
        getResearchStatus: ai.Tool<{}, {
            sourcesFound: number;
            sourcesScraped: number;
            findingsRecorded: number;
            targetSources: number;
            elapsedMs: number;
        }>;
    }, never>;
    state: {
        sources: Map<string, {
            url: string;
            title: string;
            domain: string;
            snippet?: string;
        }>;
        scrapedContent: Map<string, string>;
        findings: string[];
        startTime: number;
    };
    research(query: string, context?: string): Promise<DeepResearchAgentResult>;
};

/**
 * Deep Research Factory - creates configured deep research instance
 * KISS: single factory function for complete setup
 */

interface DeepResearchFactoryOptions {
    model: LanguageModel;
    maxTokens?: number;
}
interface DeepResearchOptions {
    effort: EffortLevel;
    context?: string;
    abortSignal?: AbortSignal;
    onProgress?: (event: ResearchEvent) => void;
}
interface DeepResearchInstance {
    /**
     * Execute research and return result directly (recommended)
     */
    researchAsync(query: string, options: DeepResearchOptions): Promise<DeepResearchAgentResult>;
    /**
     * Execute research with streaming events (legacy generator API)
     */
    research(query: string, options: DeepResearchOptions): AsyncGenerator<ResearchEvent, DeepResearchAgentResult, unknown>;
}
/**
 * Create a fully configured DeepResearch instance
 * Uses ToolLoopAgent for agentic research workflow
 */
declare function createDeepResearch(factoryOptions: DeepResearchFactoryOptions): DeepResearchInstance;

export { AcademicSearchAdapter, AiSdkLlmAdapter, type AiSdkLlmAdapterOptions, AnalysisContext, AnalyzedContent, ApiKeyAuthAdapter, type ApiKeyCredential, ApiKeyCredentialSchema, AuthManagerAdapter, type AuthMethod, AuthMethodSchema, type AuthPort, type AuthSession, AuthSessionSchema, type BrowserSessionPort, CREDIBILITY_TIERS, Citation, Conflict, ContentAnalyzerAdapter, ContentAnalyzerPort, ContentScraperPort, CookieAuthAdapter, type CookieAuthPort, type CookieCredential, CookieCredentialSchema, type Credential, CredentialSchema, type CredibilityConfig, type CredibilityTier, CredibilityTierSchema, DEFAULT_SCORING_WEIGHTS, DEFAULT_SCRAPING_CONFIG, DEFAULT_SEARCH_CONFIG, type DeepResearchAgentOptions, type DeepResearchAgentResult, type DeepResearchFactoryOptions, type DeepResearchInstance, type DeepResearchOptions, DeepResearchUseCase, DeepSearchAdapter, DeepSearchPort, EFFORT_TIMING, EffortConfig, EffortLevel, Entity, GraphBuildOptions, JS_REQUIRED_DOMAINS, KeyFinding, KnowledgeGraph, KnowledgeGraphAdapter, KnowledgeGraphPort, LLMOptions, LLMPort, LLMResponse, LightweightScraperAdapter, MindMap, NewsSearchAdapter, type OAuthConfig, OAuthConfigSchema, type OAuthPort, type OAuthToken, OAuthTokenSchema, OrchestratorPorts, OutlineSection, PLATFORM_AUTH_CONFIGS, type PhaseConfig, type Platform, type PlatformAuthConfig, PlatformSchema, type QualityScoringWeights, QualityScoringWeightsSchema, QueryDecomposer, RESEARCH_PHASES, RankedSource, RankingCriteria, RankingWeights, Relationship, type ResearchConfig, ResearchEvent, type ResearchPhase, ResearchPhaseSchema, ResearchQuery, ResearchResult, ScrapeOptions, ScrapeProgress, ScrapedContent, type ScrapingConfig, ScrapingConfigSchema, type SearchAdapterConfig, type SearchConfig, SearchConfigSchema, SearchOptions, SearchProgress, SearchResult, Section, Source, SourceRankerAdapter, SourceRankerPort, SubQuery, Synthesis, SynthesisEvent, SynthesisOptions, SynthesizerAdapter, SynthesizerPort, type TimingConfig, VectorlessDocument, VectorlessIndexOptions, VectorlessKnowledgeBaseAdapter, VectorlessKnowledgeBasePort, VectorlessQueryOptions, VectorlessQueryResult, createDeepResearch, createDeepResearchAgent, getAuthManager, getDomainCredibility, getResearchConfig, requiresJavaScript };
