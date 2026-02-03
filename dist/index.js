import {
  DeepResearchUseCase,
  EFFORT_PRESETS,
  EffortConfigSchema,
  EffortLevelSchema,
  QueryDecomposer,
  ResearchOrchestrator,
  createDeepResearchTools
} from "./chunk-ZK77RB7Y.js";

// src/config.ts
import { z } from "zod";
var ResearchPhaseSchema = z.enum([
  "query-decomposition",
  "source-discovery",
  "content-extraction",
  "analysis",
  "synthesis",
  "visualization"
]);
var RESEARCH_PHASES = [
  {
    id: "query-decomposition",
    label: "Query Decomposition",
    weight: 5,
    icon: "split"
  },
  {
    id: "source-discovery",
    label: "Source Discovery",
    weight: 25,
    icon: "search"
  },
  {
    id: "content-extraction",
    label: "Content Extraction",
    weight: 30,
    icon: "file-text"
  },
  { id: "analysis", label: "Analysis", weight: 20, icon: "brain" },
  { id: "synthesis", label: "Synthesis", weight: 15, icon: "layers" },
  { id: "visualization", label: "Visualization", weight: 5, icon: "chart" }
];
var EFFORT_TIMING = {
  standard: { estimatedMinutes: 3, displayLabel: "~3 min" },
  deep: { estimatedMinutes: 10, displayLabel: "~10 min" },
  max: { estimatedMinutes: 30, displayLabel: "~30 min" }
};
var QualityScoringWeightsSchema = z.object({
  completeness: z.number().min(0).max(1),
  depth: z.number().min(0).max(1),
  diversity: z.number().min(0).max(1)
});
var DEFAULT_SCORING_WEIGHTS = {
  completeness: 0.3,
  depth: 0.4,
  diversity: 0.3
};
var CredibilityTierSchema = z.enum([
  "academic",
  "government",
  "major-news",
  "technical",
  "general"
]);
var CREDIBILITY_TIERS = {
  academic: {
    domains: [
      "nature.com",
      "science.org",
      "springer.com",
      "wiley.com",
      "arxiv.org",
      "pubmed.ncbi.nlm.nih.gov",
      "semanticscholar.org",
      "ieee.org",
      "acm.org",
      "jstor.org"
    ],
    score: 0.95
  },
  government: {
    domains: [".gov", ".edu", "who.int", "europa.eu", "un.org"],
    score: 0.9
  },
  "major-news": {
    domains: [
      "reuters.com",
      "apnews.com",
      "bbc.com",
      "bbc.co.uk",
      "nytimes.com",
      "washingtonpost.com",
      "theguardian.com",
      "economist.com",
      "ft.com",
      "wsj.com"
    ],
    score: 0.8
  },
  technical: {
    domains: [
      "github.com",
      "stackoverflow.com",
      "developer.mozilla.org",
      "docs.microsoft.com",
      "cloud.google.com",
      "aws.amazon.com"
    ],
    score: 0.8
  },
  general: {
    domains: [],
    score: 0.5
  }
};
var JS_REQUIRED_DOMAINS = [
  "twitter.com",
  "x.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com"
];
var ScrapingConfigSchema = z.object({
  maxConcurrent: z.number().min(1).max(30),
  timeoutMs: z.number().min(5e3).max(6e4),
  maxContentLength: z.number().min(1e3).max(5e5),
  cacheTtlMs: z.number().min(6e4).max(36e5),
  maxPerDomain: z.number().min(1).max(15)
});
var DEFAULT_SCRAPING_CONFIG = {
  maxConcurrent: 15,
  timeoutMs: 2e4,
  maxContentLength: 15e4,
  cacheTtlMs: 18e5,
  // 30 min
  maxPerDomain: 5
};
var SearchConfigSchema = z.object({
  maxResultsPerQuery: z.number().min(5).max(100),
  cacheTtlMs: z.number().min(6e4).max(6e5),
  retryAttempts: z.number().min(1).max(5),
  retryDelayMs: z.number().min(500).max(5e3)
});
var DEFAULT_SEARCH_CONFIG = {
  maxResultsPerQuery: 30,
  cacheTtlMs: 3e5,
  // 5 min
  retryAttempts: 3,
  retryDelayMs: 1e3
};
function getResearchConfig(level) {
  return {
    effort: EFFORT_PRESETS[level],
    timing: EFFORT_TIMING[level],
    phases: RESEARCH_PHASES,
    scoring: DEFAULT_SCORING_WEIGHTS,
    scraping: DEFAULT_SCRAPING_CONFIG,
    search: DEFAULT_SEARCH_CONFIG
  };
}
function getDomainCredibility(domain) {
  const lowerDomain = domain.toLowerCase();
  for (const [, config] of Object.entries(CREDIBILITY_TIERS)) {
    for (const pattern of config.domains) {
      if (pattern.startsWith(".")) {
        if (lowerDomain.endsWith(pattern)) return config.score;
      } else {
        if (lowerDomain.includes(pattern)) return config.score;
      }
    }
  }
  return CREDIBILITY_TIERS.general.score;
}
function requiresJavaScript(domain) {
  const lowerDomain = domain.toLowerCase();
  return JS_REQUIRED_DOMAINS.some((d) => lowerDomain.includes(d));
}

// src/domain/source.schema.ts
import { z as z2 } from "zod";
var SourceTypeSchema = z2.enum([
  "academic",
  "news",
  "social",
  "technical",
  "official",
  "general"
]);
var MediaItemSchema = z2.object({
  type: z2.enum(["image", "video", "audio", "document"]),
  url: z2.string().url(),
  title: z2.string().optional(),
  thumbnail: z2.string().url().optional(),
  duration: z2.number().optional(),
  // seconds for video/audio
  width: z2.number().optional(),
  height: z2.number().optional()
});
var SourceSchema = z2.object({
  id: z2.string().uuid(),
  url: z2.string().url(),
  title: z2.string(),
  snippet: z2.string().optional(),
  content: z2.string().optional(),
  domain: z2.string(),
  favicon: z2.string().optional(),
  publishedAt: z2.coerce.date().optional(),
  author: z2.string().optional(),
  sourceType: SourceTypeSchema,
  credibilityScore: z2.number().min(0).max(1),
  relevanceScore: z2.number().min(0).max(1),
  finalScore: z2.number().min(0).max(1).optional(),
  media: z2.array(MediaItemSchema).default([]),
  requiresAuth: z2.boolean().default(false),
  authProvider: z2.string().optional(),
  extractedAt: z2.coerce.date().optional(),
  wordCount: z2.number().optional(),
  language: z2.string().optional()
});
var RankedSourceSchema = SourceSchema.extend({
  rank: z2.number().int().positive(),
  finalScore: z2.number().min(0).max(1)
});

// src/domain/research-query.schema.ts
import { z as z3 } from "zod";
var SearchStrategySchema = z3.enum([
  "broad",
  // Cast wide net
  "academic",
  // Focus on papers/research
  "news",
  // Recent news coverage
  "technical",
  // Code, docs, specs
  "social",
  // Discussions, opinions
  "official"
  // Government, official sources
]);
var SubQuerySchema = z3.object({
  id: z3.string().uuid(),
  query: z3.string(),
  purpose: z3.string(),
  // Why this sub-query
  strategy: SearchStrategySchema,
  priority: z3.number().min(1).max(10),
  parentId: z3.string().uuid().optional(),
  // For recursive queries
  depth: z3.number().int().min(0).max(3)
});
var ResearchQuerySchema = z3.object({
  id: z3.string().uuid(),
  originalQuery: z3.string(),
  refinedQuery: z3.string().optional(),
  mainTopics: z3.array(z3.string()),
  subQueries: z3.array(SubQuerySchema),
  temporalFocus: z3.enum(["recent", "historical", "all", "specific"]).default("all"),
  temporalRange: z3.object({
    start: z3.coerce.date().optional(),
    end: z3.coerce.date().optional()
  }).optional(),
  geographicFocus: z3.string().optional(),
  language: z3.string().default("en"),
  effort: EffortConfigSchema,
  context: z3.string().optional(),
  // User-provided context
  createdAt: z3.coerce.date()
});

// src/domain/knowledge-graph.schema.ts
import { z as z4 } from "zod";
var EntityTypeSchema = z4.enum([
  "person",
  "organization",
  "location",
  "concept",
  "event",
  "product",
  "technology",
  "date",
  "metric"
]);
var EntitySchema = z4.object({
  id: z4.string().uuid(),
  name: z4.string(),
  type: EntityTypeSchema,
  description: z4.string().optional(),
  aliases: z4.array(z4.string()).default([]),
  sourceIds: z4.array(z4.string().uuid()),
  // Sources mentioning this entity
  confidence: z4.number().min(0).max(1),
  metadata: z4.record(z4.string(), z4.unknown()).optional()
});
var RelationshipTypeSchema = z4.enum([
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
  "competes_with"
]);
var RelationshipSchema = z4.object({
  id: z4.string().uuid(),
  sourceEntityId: z4.string().uuid(),
  targetEntityId: z4.string().uuid(),
  type: RelationshipTypeSchema,
  label: z4.string().optional(),
  weight: z4.number().min(0).max(1),
  sourceIds: z4.array(z4.string().uuid())
});
var KnowledgeGraphSchema = z4.object({
  entities: z4.array(EntitySchema),
  relationships: z4.array(RelationshipSchema),
  clusters: z4.array(
    z4.object({
      id: z4.string().uuid(),
      name: z4.string(),
      entityIds: z4.array(z4.string().uuid()),
      color: z4.string().optional()
    })
  )
});
var MindMapNodeSchema = z4.lazy(
  () => z4.object({
    id: z4.string().uuid(),
    label: z4.string(),
    description: z4.string().optional(),
    children: z4.array(MindMapNodeSchema).default([]),
    color: z4.string().optional(),
    sourceIds: z4.array(z4.string().uuid()).default([])
  })
);
var MindMapSchema = z4.object({
  root: MindMapNodeSchema,
  title: z4.string()
});

// src/domain/synthesis.schema.ts
import { z as z5 } from "zod";
var CitationSchema = z5.object({
  id: z5.string(),
  // [1], [2], etc.
  sourceId: z5.string().uuid(),
  url: z5.string().url(),
  title: z5.string(),
  domain: z5.string(),
  favicon: z5.string().optional(),
  publishedAt: z5.coerce.date().optional()
});
var SectionSchema = z5.object({
  id: z5.string().uuid(),
  title: z5.string(),
  content: z5.string(),
  // Markdown with [1], [2] citations
  summary: z5.string().optional(),
  citationIds: z5.array(z5.string()),
  // Referenced citations
  media: z5.array(MediaItemSchema).default([]),
  subsections: z5.array(
    z5.object({
      title: z5.string(),
      content: z5.string(),
      citationIds: z5.array(z5.string())
    })
  ).default([]),
  order: z5.number().int()
});
var KeyFindingSchema = z5.object({
  id: z5.string().uuid(),
  finding: z5.string(),
  confidence: z5.enum(["high", "medium", "low"]),
  citationIds: z5.array(z5.string()),
  category: z5.string().optional()
});
var ConflictSchema = z5.object({
  id: z5.string().uuid(),
  topic: z5.string(),
  perspectives: z5.array(
    z5.object({
      viewpoint: z5.string(),
      sourceIds: z5.array(z5.string().uuid()),
      citationIds: z5.array(z5.string())
    })
  ),
  significance: z5.enum(["high", "medium", "low"])
});
var SynthesisSchema = z5.object({
  executiveSummary: z5.string(),
  keyFindings: z5.array(KeyFindingSchema),
  sections: z5.array(SectionSchema),
  conflicts: z5.array(ConflictSchema).default([]),
  citations: z5.array(CitationSchema),
  relatedQuestions: z5.array(z5.string()).default([]),
  generatedAt: z5.coerce.date()
});

// src/domain/research-result.schema.ts
import { z as z6 } from "zod";
var ResearchStatusSchema = z6.enum([
  "pending",
  "decomposing",
  // Query decomposition
  "searching",
  // Parallel search
  "ranking",
  // Source ranking
  "extracting",
  // Content extraction
  "analyzing",
  // Content analysis
  "synthesizing",
  // Report generation
  "visualizing",
  // Graph/chart generation
  "completed",
  "failed",
  "stopped"
  // User cancelled
]);
var ResearchStatsSchema = z6.object({
  totalSources: z6.number().int(),
  sourcesProcessed: z6.number().int(),
  stepsCompleted: z6.number().int(),
  totalSteps: z6.number().int(),
  searchQueries: z6.number().int(),
  pagesExtracted: z6.number().int(),
  tokensUsed: z6.number().int().optional(),
  durationMs: z6.number().int()
});
var QualityScoreSchema = z6.object({
  overall: z6.number().min(0).max(1),
  completeness: z6.number().min(0).max(1),
  accuracy: z6.number().min(0).max(1),
  depth: z6.number().min(0).max(1),
  diversity: z6.number().min(0).max(1),
  coherence: z6.number().min(0).max(1),
  isSOTA: z6.boolean()
});
var ChartConfigSchema = z6.object({
  type: z6.enum(["bar", "line", "area", "pie", "scatter"]),
  title: z6.string(),
  data: z6.array(z6.record(z6.string(), z6.union([z6.string(), z6.number()]))),
  xKey: z6.string(),
  yKeys: z6.array(z6.string()),
  description: z6.string().optional()
});
var TimelineEventSchema = z6.object({
  id: z6.string().uuid(),
  date: z6.coerce.date(),
  title: z6.string(),
  description: z6.string().optional(),
  sourceIds: z6.array(z6.string().uuid()),
  importance: z6.enum(["high", "medium", "low"])
});
var ResearchResultSchema = z6.object({
  id: z6.string().uuid(),
  query: ResearchQuerySchema,
  status: ResearchStatusSchema,
  progress: z6.number().min(0).max(1),
  currentPhase: z6.string(),
  sources: z6.array(SourceSchema),
  synthesis: SynthesisSchema.optional(),
  knowledgeGraph: KnowledgeGraphSchema.optional(),
  mindMap: MindMapSchema.optional(),
  charts: z6.array(ChartConfigSchema).default([]),
  timeline: z6.array(TimelineEventSchema).default([]),
  quality: QualityScoreSchema.optional(),
  stats: ResearchStatsSchema,
  startedAt: z6.coerce.date(),
  completedAt: z6.coerce.date().optional(),
  error: z6.string().optional()
});

// src/domain/events.schema.ts
import { z as z7 } from "zod";
var BaseEventSchema = z7.object({
  timestamp: z7.coerce.date(),
  researchId: z7.string().uuid()
});
var PhaseStartedEventSchema = BaseEventSchema.extend({
  type: z7.literal("phase-started"),
  phase: ResearchStatusSchema,
  message: z7.string()
});
var PhaseCompletedEventSchema = BaseEventSchema.extend({
  type: z7.literal("phase-completed"),
  phase: ResearchStatusSchema,
  durationMs: z7.number()
});
var StepStartedEventSchema = BaseEventSchema.extend({
  type: z7.literal("step-started"),
  stepId: z7.string(),
  stepType: z7.string(),
  description: z7.string(),
  parallelGroup: z7.number().optional()
  // For parallel steps
});
var StepCompletedEventSchema = BaseEventSchema.extend({
  type: z7.literal("step-completed"),
  stepId: z7.string(),
  success: z7.boolean(),
  durationMs: z7.number(),
  resultSummary: z7.string().optional()
});
var SourceFoundEventSchema = BaseEventSchema.extend({
  type: z7.literal("source-found"),
  source: SourceSchema.pick({
    id: true,
    url: true,
    title: true,
    domain: true,
    sourceType: true
  })
});
var SourceExtractedEventSchema = BaseEventSchema.extend({
  type: z7.literal("source-extracted"),
  sourceId: z7.string().uuid(),
  wordCount: z7.number(),
  mediaCount: z7.number()
});
var FindingDiscoveredEventSchema = BaseEventSchema.extend({
  type: z7.literal("finding-discovered"),
  finding: z7.string(),
  confidence: z7.enum(["high", "medium", "low"]),
  sourceIds: z7.array(z7.string().uuid())
});
var ProgressUpdateEventSchema = BaseEventSchema.extend({
  type: z7.literal("progress-update"),
  progress: z7.number().min(0).max(1),
  message: z7.string(),
  stats: z7.object({
    sourcesFound: z7.number(),
    sourcesProcessed: z7.number(),
    stepsCompleted: z7.number(),
    totalSteps: z7.number()
  })
});
var QualityCheckEventSchema = BaseEventSchema.extend({
  type: z7.literal("quality-check"),
  score: z7.number().min(0).max(1),
  isSOTA: z7.boolean(),
  shouldStop: z7.boolean(),
  reason: z7.string().optional()
});
var ErrorEventSchema = BaseEventSchema.extend({
  type: z7.literal("error"),
  error: z7.string(),
  recoverable: z7.boolean(),
  stepId: z7.string().optional()
});
var CompletedEventSchema = BaseEventSchema.extend({
  type: z7.literal("completed"),
  totalDurationMs: z7.number(),
  finalQuality: z7.number()
});
var ResearchEventSchema = z7.discriminatedUnion("type", [
  PhaseStartedEventSchema,
  PhaseCompletedEventSchema,
  StepStartedEventSchema,
  StepCompletedEventSchema,
  SourceFoundEventSchema,
  SourceExtractedEventSchema,
  FindingDiscoveredEventSchema,
  ProgressUpdateEventSchema,
  QualityCheckEventSchema,
  ErrorEventSchema,
  CompletedEventSchema
]);

// src/domain/auth.schema.ts
import { z as z8 } from "zod";
var AuthMethodSchema = z8.enum([
  "cookie",
  "oauth",
  "api_key",
  "browser_session"
]);
var PlatformSchema = z8.enum([
  "google_scholar",
  "pubmed",
  "semantic_scholar",
  "arxiv",
  "twitter",
  "linkedin",
  "reddit",
  "bloomberg",
  "reuters",
  "medium",
  "substack",
  "custom"
]);
var CredentialSchema = z8.object({
  id: z8.string(),
  platform: PlatformSchema,
  method: AuthMethodSchema,
  label: z8.string().optional(),
  createdAt: z8.date(),
  expiresAt: z8.date().optional(),
  isValid: z8.boolean()
  // Actual secrets stored encrypted separately
});
var CookieCredentialSchema = z8.object({
  domain: z8.string(),
  cookies: z8.array(
    z8.object({
      name: z8.string(),
      value: z8.string(),
      domain: z8.string(),
      path: z8.string().default("/"),
      expires: z8.number().optional(),
      httpOnly: z8.boolean().optional(),
      secure: z8.boolean().optional(),
      sameSite: z8.enum(["Strict", "Lax", "None"]).optional()
    })
  )
});
var OAuthTokenSchema = z8.object({
  accessToken: z8.string(),
  refreshToken: z8.string().optional(),
  tokenType: z8.string().default("Bearer"),
  expiresIn: z8.number().optional(),
  expiresAt: z8.date().optional(),
  scope: z8.string().optional()
});
var OAuthConfigSchema = z8.object({
  clientId: z8.string(),
  clientSecret: z8.string().optional(),
  authorizationUrl: z8.string().url(),
  tokenUrl: z8.string().url(),
  redirectUri: z8.string().url(),
  scope: z8.string().optional()
});
var ApiKeyCredentialSchema = z8.object({
  apiKey: z8.string(),
  headerName: z8.string().default("Authorization"),
  headerPrefix: z8.string().default("Bearer")
});
var AuthSessionSchema = z8.object({
  platform: PlatformSchema,
  isAuthenticated: z8.boolean(),
  lastChecked: z8.date(),
  error: z8.string().optional()
});
var PLATFORM_AUTH_CONFIGS = {
  google_scholar: {
    platform: "google_scholar",
    displayName: "Google Scholar",
    description: "Access academic papers and citations",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: false,
    domains: ["scholar.google.com"]
  },
  pubmed: {
    platform: "pubmed",
    displayName: "PubMed",
    description: "Medical and life sciences literature",
    supportedMethods: ["api_key"],
    requiredForPremium: false,
    domains: ["pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov"]
  },
  semantic_scholar: {
    platform: "semantic_scholar",
    displayName: "Semantic Scholar",
    description: "AI-powered academic search",
    supportedMethods: ["api_key"],
    requiredForPremium: false,
    domains: ["semanticscholar.org", "api.semanticscholar.org"]
  },
  arxiv: {
    platform: "arxiv",
    displayName: "arXiv",
    description: "Preprints in physics, math, CS",
    supportedMethods: [],
    requiredForPremium: false,
    domains: ["arxiv.org"]
  },
  twitter: {
    platform: "twitter",
    displayName: "Twitter / X",
    description: "Real-time social insights",
    supportedMethods: ["cookie", "oauth", "browser_session"],
    requiredForPremium: true,
    domains: ["twitter.com", "x.com"]
  },
  linkedin: {
    platform: "linkedin",
    displayName: "LinkedIn",
    description: "Professional network insights",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: true,
    domains: ["linkedin.com"]
  },
  reddit: {
    platform: "reddit",
    displayName: "Reddit",
    description: "Community discussions and opinions",
    supportedMethods: ["oauth", "api_key"],
    requiredForPremium: false,
    domains: ["reddit.com", "old.reddit.com"]
  },
  bloomberg: {
    platform: "bloomberg",
    displayName: "Bloomberg",
    description: "Financial news and data",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: true,
    domains: ["bloomberg.com"]
  },
  reuters: {
    platform: "reuters",
    displayName: "Reuters",
    description: "Global news coverage",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["reuters.com"]
  },
  medium: {
    platform: "medium",
    displayName: "Medium",
    description: "Articles and blog posts",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["medium.com"]
  },
  substack: {
    platform: "substack",
    displayName: "Substack",
    description: "Newsletter content",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["substack.com"]
  },
  custom: {
    platform: "custom",
    displayName: "Custom Source",
    description: "User-defined authentication",
    supportedMethods: ["cookie", "api_key", "browser_session"],
    requiredForPremium: false,
    domains: []
  }
};

// src/ports/source-ranker.port.ts
var DEFAULT_RANKING_WEIGHTS = {
  credibility: 0.25,
  relevance: 0.35,
  recency: 0.15,
  diversity: 0.1,
  depth: 0.15
};

// src/ports/knowledge-graph.port.ts
var DEFAULT_GRAPH_OPTIONS = {
  minEntityConfidence: 0.6,
  minRelationshipWeight: 0.4,
  maxNodes: 100,
  clusterByTopic: true
};

// src/ports/synthesizer.port.ts
var DEFAULT_SYNTHESIS_OPTIONS = {
  maxSummaryLength: 500,
  maxSectionsCount: 6,
  includeConflicts: true,
  generateRelatedQuestions: true,
  language: "en"
};

// src/adapters/lightweight-scraper.adapter.ts
import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
var USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];
var LightweightScraperAdapter = class {
  cache;
  concurrencyLimit;
  config;
  constructor(config) {
    this.config = { ...DEFAULT_SCRAPING_CONFIG, ...config };
    this.cache = new LRUCache({
      max: 500,
      ttl: this.config.cacheTtlMs
    });
    this.concurrencyLimit = pLimit(this.config.maxConcurrent);
  }
  async scrape(url, options) {
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const startTime = Date.now();
    try {
      const response = await this.fetchWithTimeout(url, options);
      if (!response.ok) {
        return this.errorResult(url, `HTTP ${response.status}`, startTime);
      }
      const html = await response.text();
      const result = this.parseHtml(url, html, options);
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return this.errorResult(url, message, startTime);
    }
  }
  async *scrapeMany(urls, options, onProgress) {
    const tasks = urls.map(
      (url) => this.concurrencyLimit(async () => {
        onProgress?.({ url, status: "fetching", progress: 0 });
        const result = await this.scrape(url, options);
        onProgress?.({
          url,
          status: result.success ? "completed" : "failed",
          progress: 1
        });
        return result;
      })
    );
    for (const task of tasks) {
      yield await task;
    }
  }
  canScrapeWithoutBrowser(url) {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return !requiresJavaScript(domain);
    } catch {
      return false;
    }
  }
  getSupportedDomains() {
    return [
      "wikipedia.org",
      "github.com",
      "arxiv.org",
      "medium.com",
      "dev.to",
      "stackoverflow.com",
      "news.ycombinator.com",
      "reddit.com",
      "bbc.com",
      "cnn.com",
      "reuters.com",
      "nature.com",
      "sciencedirect.com"
    ];
  }
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = options.timeout || this.config.timeoutMs;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": options.userAgent || this.getRandomUserAgent(),
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache"
        },
        redirect: options.followRedirects ? "follow" : "manual"
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
  parseHtml(url, html, options) {
    const startTime = Date.now();
    const maxLength = options.maxContentLength || this.config.maxContentLength;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    );
    const excerpt = descMatch?.[1]?.trim() || "";
    const authorMatch = html.match(
      /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i
    );
    const author = authorMatch?.[1]?.trim();
    const dateMatch = html.match(
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
    const publishedAt = dateMatch?.[1] ? new Date(dateMatch[1]) : void 0;
    const content = this.extractMainContent(html, maxLength);
    const media = options.extractMedia ? this.extractMedia(html, url) : [];
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const language = langMatch?.[1]?.substring(0, 2);
    return {
      url,
      title,
      content,
      excerpt,
      author,
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : void 0,
      media,
      wordCount: content.split(/\s+/).length,
      language,
      success: true,
      durationMs: Date.now() - startTime
    };
  }
  extractMainContent(html, maxLength) {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "").replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "").replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "").replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || text.match(
      /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );
    if (mainMatch) {
      text = mainMatch[1];
    }
    text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + "...";
    }
    return text;
  }
  extractMedia(html, baseUrl) {
    const media = [];
    const baseUrlObj = new URL(baseUrl);
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null && media.length < 10) {
      const src = this.resolveUrl(imgMatch[1], baseUrlObj);
      if (src && !src.includes("data:") && !src.includes("pixel")) {
        const altMatch = imgMatch[0].match(/alt=["']([^"']+)["']/i);
        media.push({
          type: "image",
          url: src,
          title: altMatch?.[1]
        });
      }
    }
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let iframeMatch;
    while ((iframeMatch = iframeRegex.exec(html)) !== null && media.length < 15) {
      const src = iframeMatch[1];
      if (src.includes("youtube.com") || src.includes("youtu.be")) {
        media.push({ type: "video", url: src });
      } else if (src.includes("vimeo.com")) {
        media.push({ type: "video", url: src });
      }
    }
    return media;
  }
  resolveUrl(src, baseUrl) {
    try {
      if (src.startsWith("//")) {
        return `${baseUrl.protocol}${src}`;
      }
      if (src.startsWith("/")) {
        return `${baseUrl.origin}${src}`;
      }
      if (src.startsWith("http")) {
        return src;
      }
      return new URL(src, baseUrl.origin).href;
    } catch {
      return null;
    }
  }
  getCacheKey(url, options) {
    return `${url}|${options.extractMedia}|${options.maxContentLength}`;
  }
  getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
  errorResult(url, error, startTime) {
    return {
      url,
      title: "",
      content: "",
      excerpt: "",
      media: [],
      wordCount: 0,
      success: false,
      error,
      durationMs: Date.now() - startTime
    };
  }
};

// src/adapters/deep-search.adapter.ts
import { LRUCache as LRUCache2 } from "lru-cache";
import pLimit2 from "p-limit";
import { v4 as uuid } from "uuid";
var CACHE_TTL = 5 * 60 * 1e3;
var CACHE_MAX = 200;
var STRATEGY_TO_TYPE = {
  broad: "general",
  academic: "academic",
  news: "news",
  technical: "technical",
  social: "social",
  official: "official"
};
var DeepSearchAdapter = class {
  cache;
  concurrencyLimit;
  defaultTimeout;
  constructor(config = {}) {
    this.cache = new LRUCache2({ max: CACHE_MAX, ttl: CACHE_TTL });
    this.concurrencyLimit = pLimit2(config.maxConcurrency ?? 10);
    this.defaultTimeout = config.defaultTimeout ?? 3e4;
  }
  async search(query, options) {
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const startTime = Date.now();
    try {
      const searchQuery = this.buildSearchQuery(query, options);
      const results = await this.executeSearch(searchQuery, options);
      const searchResult = {
        query,
        sources: results.map((r) => this.toSource(r, options.strategy)),
        totalFound: results.length,
        durationMs: Date.now() - startTime
      };
      this.cache.set(cacheKey, searchResult);
      return searchResult;
    } catch (error) {
      return {
        query,
        sources: [],
        totalFound: 0,
        durationMs: Date.now() - startTime
      };
    }
  }
  async *searchParallel(queries, options, onProgress) {
    const sortedQueries = [...queries].sort((a, b) => b.priority - a.priority);
    const tasks = sortedQueries.map(
      (subQuery) => this.concurrencyLimit(async () => {
        onProgress?.({
          query: subQuery.query,
          status: "searching",
          progress: 0.5,
          resultsFound: 0
        });
        const result = await this.search(subQuery.query, {
          ...options,
          strategy: subQuery.strategy
        });
        onProgress?.({
          query: subQuery.query,
          status: "completed",
          progress: 1,
          resultsFound: result.sources.length
        });
        return result;
      })
    );
    for (const task of tasks) {
      yield await task;
    }
  }
  async isAvailable() {
    try {
      const result = await this.search("test", {
        maxResults: 1,
        timeout: 5e3,
        strategy: "broad"
      });
      return result.sources.length >= 0;
    } catch {
      return false;
    }
  }
  getName() {
    return "DeepSearchAdapter";
  }
  buildSearchQuery(query, options) {
    let searchQuery = query;
    if (options.strategy === "academic") {
      searchQuery = `${query} site:arxiv.org OR site:scholar.google.com OR site:pubmed.gov OR site:nature.com`;
    }
    if (options.strategy === "official") {
      searchQuery = `${query} site:gov OR site:edu OR site:org`;
    }
    if (options.strategy === "technical") {
      searchQuery = `${query} site:github.com OR site:stackoverflow.com OR site:dev.to`;
    }
    if (options.dateRange?.start || options.dateRange?.end) {
      const start = options.dateRange.start?.toISOString().split("T")[0];
      const end = options.dateRange.end?.toISOString().split("T")[0];
      if (start && end) {
        searchQuery = `${searchQuery} date:${start}..${end}`;
      }
    }
    return searchQuery;
  }
  async executeSearch(query, options) {
    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout
    );
    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      if (!response.ok) {
        return [];
      }
      const html = await response.text();
      return this.parseDuckDuckGoResults(html, options.maxResults);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  parseDuckDuckGoResults(html, maxResults) {
    const results = [];
    const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]*)/gi;
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      const [, url, title, snippet] = match;
      if (url && title && !url.includes("duckduckgo.com")) {
        results.push({
          url: this.cleanUrl(url),
          title: this.cleanText(title),
          snippet: this.cleanText(snippet)
        });
      }
    }
    if (results.length === 0) {
      const simpleRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
      while ((match = simpleRegex.exec(html)) !== null && results.length < maxResults) {
        const url = match[1];
        if (!url.includes("duckduckgo.com")) {
          results.push({ url, title: "", snippet: "" });
        }
      }
    }
    return results;
  }
  cleanUrl(url) {
    if (url.includes("uddg=")) {
      const match = url.match(/uddg=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return url;
  }
  cleanText(text) {
    return text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
  }
  toSource(result, strategy) {
    const url = new URL(result.url);
    return {
      id: uuid(),
      url: result.url,
      title: result.title || url.hostname,
      snippet: result.snippet,
      domain: url.hostname.replace("www.", ""),
      sourceType: STRATEGY_TO_TYPE[strategy],
      credibilityScore: this.estimateCredibility(url.hostname),
      relevanceScore: 0.5,
      // Will be calculated later by ranker
      media: [],
      requiresAuth: false
    };
  }
  estimateCredibility(domain) {
    const cleanDomain = domain.replace("www.", "");
    if (cleanDomain.endsWith(".gov") || cleanDomain.endsWith(".edu") || cleanDomain.includes("nature.com") || cleanDomain.includes("science.org") || cleanDomain.includes("arxiv.org") || cleanDomain.includes("pubmed")) {
      return 0.9;
    }
    if (cleanDomain.includes("wikipedia.org") || cleanDomain.includes("github.com") || cleanDomain.includes("stackoverflow.com") || cleanDomain.includes("bbc.com") || cleanDomain.includes("reuters.com")) {
      return 0.8;
    }
    if (cleanDomain.includes("medium.com") || cleanDomain.includes("dev.to") || cleanDomain.endsWith(".org")) {
      return 0.7;
    }
    return 0.5;
  }
  getCacheKey(query, options) {
    return `${query}|${options.strategy}|${options.maxResults}`;
  }
};

// src/adapters/source-ranker.adapter.ts
var DEFAULT_WEIGHTS = {
  credibility: 0.25,
  relevance: 0.35,
  recency: 0.15,
  diversity: 0.1,
  depth: 0.15
};
var SourceRankerAdapter = class {
  weights;
  constructor(weights) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }
  async rank(sources, criteria) {
    const seenDomains = /* @__PURE__ */ new Map();
    const scored = sources.map((source) => {
      const credibility = this.getCredibilityScore(source.domain);
      const relevance = this.calculateRelevance(source, criteria);
      const recency = this.calculateRecency(source.publishedAt);
      const depth = this.calculateDepth(source);
      const domainCount = seenDomains.get(source.domain) || 0;
      seenDomains.set(source.domain, domainCount + 1);
      const diversity = Math.max(0, 1 - domainCount * 0.3);
      const finalScore = credibility * this.weights.credibility + relevance * this.weights.relevance + recency * this.weights.recency + diversity * this.weights.diversity + depth * this.weights.depth;
      return { source, finalScore };
    });
    scored.sort((a, b) => b.finalScore - a.finalScore);
    if (criteria.preferredTypes?.length) {
      scored.sort((a, b) => {
        const aPreferred = criteria.preferredTypes.includes(
          a.source.sourceType
        );
        const bPreferred = criteria.preferredTypes.includes(
          b.source.sourceType
        );
        if (aPreferred && !bPreferred) return -1;
        if (!aPreferred && bPreferred) return 1;
        return b.finalScore - a.finalScore;
      });
    }
    return scored.map(({ source, finalScore }, index) => ({
      ...source,
      rank: index + 1,
      finalScore,
      relevanceScore: this.calculateRelevance(source, criteria)
    }));
  }
  filterByCredibility(sources, minScore) {
    return sources.filter(
      (source) => this.getCredibilityScore(source.domain) >= minScore
    );
  }
  diversify(sources, maxPerDomain) {
    const domainCounts = /* @__PURE__ */ new Map();
    return sources.filter((source) => {
      const count = domainCounts.get(source.domain) || 0;
      if (count >= maxPerDomain) return false;
      domainCounts.set(source.domain, count + 1);
      return true;
    });
  }
  getCredibilityScore(domain) {
    return getDomainCredibility(domain);
  }
  setWeights(weights) {
    this.weights = { ...this.weights, ...weights };
  }
  calculateRelevance(source, criteria) {
    let score = source.relevanceScore || 0.5;
    const queryTerms = criteria.query.toLowerCase().split(/\s+/);
    const titleLower = source.title.toLowerCase();
    const matchingTerms = queryTerms.filter(
      (term) => titleLower.includes(term)
    ).length;
    score += matchingTerms / queryTerms.length * 0.3;
    if (source.snippet) {
      const snippetLower = source.snippet.toLowerCase();
      const topicMatches = criteria.topics.filter(
        (topic) => snippetLower.includes(topic.toLowerCase())
      ).length;
      score += topicMatches / Math.max(criteria.topics.length, 1) * 0.2;
    }
    return Math.min(1, score);
  }
  calculateRecency(publishedAt) {
    if (!publishedAt) return 0.5;
    const now = /* @__PURE__ */ new Date();
    const ageInDays = (now.getTime() - publishedAt.getTime()) / (1e3 * 60 * 60 * 24);
    if (ageInDays <= 7) return 1;
    if (ageInDays <= 30) return 0.9;
    if (ageInDays <= 90) return 0.8;
    if (ageInDays <= 365) return 0.6;
    if (ageInDays <= 730) return 0.4;
    return 0.2;
  }
  calculateDepth(source) {
    let score = 0.5;
    if (source.wordCount) {
      if (source.wordCount > 2e3) score += 0.3;
      else if (source.wordCount > 1e3) score += 0.2;
      else if (source.wordCount > 500) score += 0.1;
    }
    if (source.media.length > 0) {
      score += Math.min(0.2, source.media.length * 0.05);
    }
    return Math.min(1, score);
  }
};

// src/adapters/content-analyzer.adapter.ts
import { v4 as uuid2 } from "uuid";
import { z as z9 } from "zod";
var AnalysisResultSchema = z9.object({
  keyPoints: z9.array(z9.string()),
  entities: z9.array(
    z9.object({
      name: z9.string(),
      type: z9.enum([
        "person",
        "organization",
        "location",
        "concept",
        "event",
        "product",
        "technology",
        "date",
        "metric"
      ]),
      description: z9.string().optional()
    })
  ),
  claims: z9.array(
    z9.object({
      statement: z9.string(),
      confidence: z9.number().min(0).max(1),
      evidence: z9.string()
    })
  ),
  topics: z9.array(z9.string()),
  sentiment: z9.enum(["positive", "negative", "neutral"]),
  quality: z9.object({
    relevance: z9.number().min(0).max(1),
    factualDensity: z9.number().min(0).max(1),
    clarity: z9.number().min(0).max(1)
  })
});
var ConflictSchema2 = z9.array(
  z9.object({
    topic: z9.string(),
    perspectives: z9.array(
      z9.object({
        viewpoint: z9.string(),
        sourceIndices: z9.array(z9.number())
      })
    ),
    significance: z9.enum(["high", "medium", "low"])
  })
);
var KeyFindingsSchema = z9.array(
  z9.object({
    finding: z9.string(),
    confidence: z9.enum(["high", "medium", "low"]),
    sourceIndices: z9.array(z9.number()),
    category: z9.string().optional()
  })
);
var ContentAnalyzerAdapter = class {
  constructor(llm) {
    this.llm = llm;
  }
  async analyze(content, context) {
    const truncatedContent = content.length > 15e3 ? content.slice(0, 15e3) + "..." : content;
    const prompt = `Analyze the following content in the context of the research query.

QUERY: "${context.query}"
TOPICS OF INTEREST: ${context.topics.join(", ")}

CONTENT:
${truncatedContent}

Extract:
1. Key points (3-7 important insights)
2. Named entities (people, organizations, concepts, etc.)
3. Factual claims with confidence scores
4. Main topics covered
5. Overall sentiment
6. Quality assessment (relevance to query, factual density, clarity)

Return a JSON object with these fields.`;
    try {
      const result = await this.llm.generate(prompt, AnalysisResultSchema);
      const entities = result.data.entities.map((e) => ({
        id: uuid2(),
        name: e.name,
        type: e.type,
        description: e.description,
        aliases: [],
        sourceIds: [context.sourceId],
        confidence: 0.8
      }));
      const claims = result.data.claims.map((c) => ({
        id: uuid2(),
        statement: c.statement,
        confidence: c.confidence,
        sourceId: context.sourceId,
        evidence: c.evidence
      }));
      const quality = {
        relevance: result.data.quality.relevance,
        factualDensity: result.data.quality.factualDensity,
        clarity: result.data.quality.clarity,
        overall: (result.data.quality.relevance + result.data.quality.factualDensity + result.data.quality.clarity) / 3
      };
      return {
        sourceId: context.sourceId,
        entities,
        keyPoints: result.data.keyPoints,
        claims,
        sentiment: result.data.sentiment,
        topics: result.data.topics,
        quality
      };
    } catch (error) {
      return {
        sourceId: context.sourceId,
        entities: [],
        keyPoints: [],
        claims: [],
        topics: context.topics,
        quality: {
          relevance: 0.5,
          factualDensity: 0.5,
          clarity: 0.5,
          overall: 0.5
        }
      };
    }
  }
  async extractEntities(content) {
    const prompt = `Extract all named entities from this content. Include people, organizations, locations, concepts, events, products, technologies, dates, and metrics.

CONTENT:
${content.slice(0, 1e4)}

Return a JSON array of entities with: name, type, description (optional).`;
    try {
      const result = await this.llm.generate(
        prompt,
        z9.array(
          z9.object({
            name: z9.string(),
            type: z9.enum([
              "person",
              "organization",
              "location",
              "concept",
              "event",
              "product",
              "technology",
              "date",
              "metric"
            ]),
            description: z9.string().optional()
          })
        )
      );
      return result.data.map((e) => ({
        id: uuid2(),
        name: e.name,
        type: e.type,
        description: e.description,
        aliases: [],
        sourceIds: [],
        confidence: 0.75
      }));
    } catch {
      return [];
    }
  }
  async extractRelationships(content, entities) {
    if (entities.length < 2) return [];
    const entityNames = entities.map((e) => e.name).join(", ");
    const prompt = `Given these entities: ${entityNames}

Find relationships between them in this content:
${content.slice(0, 5e4)}

Return a JSON array of relationships with:
- sourceEntity: name of source entity
- targetEntity: name of target entity  
- type: one of [related_to, part_of, causes, caused_by, supports, contradicts, precedes, follows, located_in, works_for, created_by, competes_with]
- label: brief description of the relationship`;
    try {
      const result = await this.llm.generate(
        prompt,
        z9.array(
          z9.object({
            sourceEntity: z9.string(),
            targetEntity: z9.string(),
            type: z9.enum([
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
              "competes_with"
            ]),
            label: z9.string().optional()
          })
        )
      );
      const entityMap = new Map(entities.map((e) => [e.name.toLowerCase(), e]));
      const relationships = [];
      for (const r of result.data) {
        const source = entityMap.get(r.sourceEntity.toLowerCase());
        const target = entityMap.get(r.targetEntity.toLowerCase());
        if (!source || !target) continue;
        relationships.push({
          id: uuid2(),
          sourceEntityId: source.id,
          targetEntityId: target.id,
          type: r.type,
          label: r.label,
          weight: 0.7,
          sourceIds: []
        });
      }
      return relationships;
    } catch {
      return [];
    }
  }
  async detectConflicts(contents) {
    if (contents.length < 2) return [];
    const claimsSummary = contents.map(
      (c, i) => `Source ${i + 1} claims:
${c.claims.map((cl) => `- ${cl.statement}`).join("\n")}`
    ).join("\n\n");
    const prompt = `Analyze these claims from different sources and identify any conflicts or contradictions:

${claimsSummary}

Find topics where sources disagree or present conflicting information.
Return a JSON array of conflicts with:
- topic: the subject of disagreement
- perspectives: array of {viewpoint, sourceIndices} showing different views
- significance: high/medium/low based on importance`;
    try {
      const result = await this.llm.generate(prompt, ConflictSchema2);
      return result.data.map((c) => ({
        id: uuid2(),
        topic: c.topic,
        perspectives: c.perspectives.map((p) => ({
          viewpoint: p.viewpoint,
          sourceIds: p.sourceIndices.map((i) => contents[i]?.sourceId ?? ""),
          citationIds: []
        })),
        significance: c.significance
      }));
    } catch {
      return [];
    }
  }
  async extractKeyFindings(contents) {
    const keyPointsSummary = contents.map(
      (c, i) => `Source ${i + 1} key points:
${c.keyPoints.map((kp) => `- ${kp}`).join("\n")}`
    ).join("\n\n");
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
      const result = await this.llm.generate(prompt, KeyFindingsSchema);
      return result.data.map((f) => ({
        id: uuid2(),
        finding: f.finding,
        confidence: f.confidence,
        citationIds: f.sourceIndices.map((i) => `[${i + 1}]`),
        category: f.category
      }));
    } catch {
      return [];
    }
  }
};

// src/adapters/synthesizer.adapter.ts
import { v4 as uuid3 } from "uuid";
import { z as z10 } from "zod";
var OutlineSchema = z10.array(
  z10.object({
    title: z10.string(),
    topics: z10.array(z10.string()),
    sourceIndices: z10.array(z10.number())
  })
);
var SectionContentSchema = z10.object({
  content: z10.string(),
  summary: z10.string().optional(),
  citationIndices: z10.array(z10.number())
});
var DEFAULT_OPTIONS = {
  maxSummaryLength: 500,
  maxSectionsCount: 6,
  includeConflicts: true,
  generateRelatedQuestions: true,
  language: "en"
};
var SynthesizerAdapter = class {
  constructor(llm) {
    this.llm = llm;
  }
  async *synthesize(contents, sources, query, graph, options) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const citations = this.formatCitations(sources);
    const outline = await this.generateOutline(contents, query);
    yield { type: "outline", data: outline };
    const executiveSummary = await this.generateSummary(
      contents,
      opts.maxSummaryLength
    );
    yield { type: "summary", data: executiveSummary };
    const sections = [];
    for (const [index, outlineSection] of outline.entries()) {
      const section = await this.generateSection(
        outlineSection,
        contents,
        sources
      );
      sections.push({ ...section, order: index });
      yield { type: "section", data: section };
    }
    const keyFindings = await this.extractFindings(contents);
    yield { type: "findings", data: keyFindings };
    let relatedQuestions = [];
    if (opts.generateRelatedQuestions) {
      relatedQuestions = await this.generateRelatedQuestions(query, contents);
      yield { type: "questions", data: relatedQuestions };
    }
    const synthesis = {
      executiveSummary,
      keyFindings,
      sections,
      conflicts: [],
      citations,
      relatedQuestions,
      generatedAt: /* @__PURE__ */ new Date()
    };
    yield { type: "complete", data: synthesis };
    return synthesis;
  }
  async generateOutline(contents, query) {
    const topicsSummary = contents.map((c, i) => `Source ${i + 1}: ${c.topics.join(", ")}`).join("\n");
    const keyPointsSummary = contents.map((c, i) => `Source ${i + 1}: ${c.keyPoints.slice(0, 3).join("; ")}`).join("\n");
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
        sourceIds: s.sourceIndices.map((i) => contents[i]?.sourceId ?? "")
      }));
    } catch {
      return [
        {
          title: "Overview",
          topics: query.mainTopics,
          sourceIds: contents.slice(0, 3).map((c) => c.sourceId)
        },
        {
          title: "Key Findings",
          topics: ["findings", "insights"],
          sourceIds: contents.map((c) => c.sourceId)
        },
        {
          title: "Analysis",
          topics: ["analysis", "implications"],
          sourceIds: contents.slice(-3).map((c) => c.sourceId)
        }
      ];
    }
  }
  async generateSummary(contents, maxLength) {
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
  async generateSection(outline, contents, sources) {
    const relevantContents = contents.filter(
      (c) => outline.sourceIds.includes(c.sourceId) || c.topics.some((t) => outline.topics.includes(t))
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
        id: uuid3(),
        title: outline.title,
        content: result.data.content,
        summary: result.data.summary,
        citationIds: result.data.citationIndices.map((i) => `[${i}]`),
        media: [],
        subsections: [],
        order: 0
      };
    } catch {
      return {
        id: uuid3(),
        title: outline.title,
        content: `This section covers ${outline.topics.join(", ")} based on ${outline.sourceIds.length} sources.`,
        citationIds: [],
        media: [],
        subsections: [],
        order: 0
      };
    }
  }
  formatCitations(sources) {
    return sources.map((source, index) => ({
      id: `[${index + 1}]`,
      sourceId: source.id,
      url: source.url,
      title: source.title,
      domain: source.domain,
      favicon: source.favicon,
      publishedAt: source.publishedAt
    }));
  }
  async extractFindings(contents) {
    const allKeyPoints = contents.flatMap(
      (c, i) => c.keyPoints.map((kp) => ({ point: kp, sourceIndex: i }))
    );
    const uniquePoints = [...new Set(allKeyPoints.map((p) => p.point))];
    return uniquePoints.slice(0, 10).map((point, i) => ({
      id: uuid3(),
      finding: point,
      confidence: i < 3 ? "high" : i < 7 ? "medium" : "low",
      citationIds: allKeyPoints.filter((p) => p.point === point).map((p) => `[${p.sourceIndex + 1}]`)
    }));
  }
  async generateRelatedQuestions(query, contents) {
    const topics = [...new Set(contents.flatMap((c) => c.topics))];
    const prompt = `Based on this research query and findings, suggest 3-5 follow-up questions.

Original query: "${query.originalQuery}"
Topics covered: ${topics.join(", ")}
Main findings: ${contents.flatMap((c) => c.keyPoints).slice(0, 5).join("; ")}

Generate questions that:
1. Explore deeper aspects of the topic
2. Address gaps in the current research
3. Investigate related but uncovered areas

Return a JSON array of question strings.`;
    try {
      const result = await this.llm.generate(prompt, z10.array(z10.string()));
      return result.data.slice(0, 5);
    } catch {
      return [
        `What are the latest developments in ${query.mainTopics[0]}?`,
        `How does ${query.mainTopics[0]} compare to alternatives?`,
        `What are the future implications of these findings?`
      ];
    }
  }
};

// src/adapters/knowledge-graph.adapter.ts
import { v4 as uuid4 } from "uuid";
var DEFAULT_OPTIONS2 = {
  minEntityConfidence: 0.6,
  minRelationshipWeight: 0.4,
  maxNodes: 100,
  clusterByTopic: true
};
var KnowledgeGraphAdapter = class {
  async build(contents, options) {
    const opts = { ...DEFAULT_OPTIONS2, ...options };
    const entityMap = /* @__PURE__ */ new Map();
    for (const content of contents) {
      for (const entity of content.entities) {
        if (entity.confidence < opts.minEntityConfidence) continue;
        const key = entity.name.toLowerCase();
        if (entityMap.has(key)) {
          const existing = entityMap.get(key);
          existing.sourceIds = [
            .../* @__PURE__ */ new Set([...existing.sourceIds, ...entity.sourceIds])
          ];
          existing.confidence = Math.max(
            existing.confidence,
            entity.confidence
          );
        } else {
          entityMap.set(key, { ...entity });
        }
      }
    }
    let entities = Array.from(entityMap.values()).sort((a, b) => b.confidence - a.confidence).slice(0, opts.maxNodes);
    const relationships = [];
    const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));
    for (const content of contents) {
      const contentEntities = content.entities.filter(
        (e) => entityNames.has(e.name.toLowerCase())
      );
      for (let i = 0; i < contentEntities.length; i++) {
        for (let j = i + 1; j < contentEntities.length; j++) {
          const sourceEntity = entityMap.get(
            contentEntities[i].name.toLowerCase()
          );
          const targetEntity = entityMap.get(
            contentEntities[j].name.toLowerCase()
          );
          if (sourceEntity && targetEntity) {
            relationships.push({
              id: uuid4(),
              sourceEntityId: sourceEntity.id,
              targetEntityId: targetEntity.id,
              type: "related_to",
              weight: 0.5,
              sourceIds: [content.sourceId]
            });
          }
        }
      }
    }
    const relationshipMap = /* @__PURE__ */ new Map();
    for (const rel of relationships) {
      const key = `${rel.sourceEntityId}-${rel.targetEntityId}`;
      if (relationshipMap.has(key)) {
        const existing = relationshipMap.get(key);
        existing.weight = Math.min(1, existing.weight + 0.1);
        existing.sourceIds = [
          .../* @__PURE__ */ new Set([...existing.sourceIds, ...rel.sourceIds])
        ];
      } else {
        relationshipMap.set(key, rel);
      }
    }
    const filteredRelationships = Array.from(relationshipMap.values()).filter(
      (r) => r.weight >= opts.minRelationshipWeight
    );
    const clusters = opts.clusterByTopic ? this.createClusters(entities, contents) : [];
    return {
      entities,
      relationships: filteredRelationships,
      clusters
    };
  }
  merge(graphs) {
    const entityMap = /* @__PURE__ */ new Map();
    const relationshipMap = /* @__PURE__ */ new Map();
    for (const graph of graphs) {
      for (const entity of graph.entities) {
        const key = entity.name.toLowerCase();
        if (!entityMap.has(key)) {
          entityMap.set(key, entity);
        } else {
          const existing = entityMap.get(key);
          existing.sourceIds = [
            .../* @__PURE__ */ new Set([...existing.sourceIds, ...entity.sourceIds])
          ];
        }
      }
      for (const rel of graph.relationships) {
        const key = `${rel.sourceEntityId}-${rel.targetEntityId}`;
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, rel);
        }
      }
    }
    return {
      entities: Array.from(entityMap.values()),
      relationships: Array.from(relationshipMap.values()),
      clusters: []
    };
  }
  findConnections(entityId, graph, depth = 1) {
    const connectedEntityIds = /* @__PURE__ */ new Set([entityId]);
    const connectedRelationships = [];
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
      relationships: connectedRelationships
    };
  }
  toMindMap(graph, rootTopic) {
    const rootEntity = graph.entities.find(
      (e) => e.name.toLowerCase() === rootTopic.toLowerCase()
    ) || graph.entities.find((e) => e.type === "concept") || graph.entities[0];
    if (!rootEntity) {
      return {
        title: rootTopic,
        root: {
          id: uuid4(),
          label: rootTopic,
          children: [],
          sourceIds: []
        }
      };
    }
    const root = this.buildMindMapNode(rootEntity, graph, /* @__PURE__ */ new Set());
    return {
      title: rootTopic,
      root
    };
  }
  getCentralEntities(graph, limit) {
    const centrality = /* @__PURE__ */ new Map();
    for (const entity of graph.entities) {
      centrality.set(entity.id, 0);
    }
    for (const rel of graph.relationships) {
      centrality.set(
        rel.sourceEntityId,
        (centrality.get(rel.sourceEntityId) || 0) + rel.weight
      );
      centrality.set(
        rel.targetEntityId,
        (centrality.get(rel.targetEntityId) || 0) + rel.weight
      );
    }
    return graph.entities.sort((a, b) => (centrality.get(b.id) || 0) - (centrality.get(a.id) || 0)).slice(0, limit);
  }
  createClusters(entities, contents) {
    const topicEntityMap = /* @__PURE__ */ new Map();
    for (const content of contents) {
      for (const topic of content.topics) {
        if (!topicEntityMap.has(topic)) {
          topicEntityMap.set(topic, /* @__PURE__ */ new Set());
        }
        for (const entity of content.entities) {
          topicEntityMap.get(topic).add(entity.id);
        }
      }
    }
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD"
    ];
    return Array.from(topicEntityMap.entries()).slice(0, 6).map(([topic, entityIds], i) => ({
      id: uuid4(),
      name: topic,
      entityIds: Array.from(entityIds),
      color: colors[i % colors.length]
    }));
  }
  buildMindMapNode(entity, graph, visited, depth = 0) {
    if (visited.has(entity.id) || depth > 3) {
      return {
        id: entity.id,
        label: entity.name,
        description: entity.description,
        children: [],
        sourceIds: entity.sourceIds
      };
    }
    visited.add(entity.id);
    const connectedIds = /* @__PURE__ */ new Set();
    for (const rel of graph.relationships) {
      if (rel.sourceEntityId === entity.id) {
        connectedIds.add(rel.targetEntityId);
      }
      if (rel.targetEntityId === entity.id) {
        connectedIds.add(rel.sourceEntityId);
      }
    }
    const children = graph.entities.filter((e) => connectedIds.has(e.id) && !visited.has(e.id)).slice(0, 5).map((e) => this.buildMindMapNode(e, graph, visited, depth + 1));
    return {
      id: entity.id,
      label: entity.name,
      description: entity.description,
      children,
      sourceIds: entity.sourceIds
    };
  }
};

// src/adapters/cookie-auth.adapter.ts
var cookieStore = /* @__PURE__ */ new Map();
var CookieAuthAdapter = class {
  /**
   * Import cookies from Netscape format (common browser export)
   * Format: domain\tinclude_subdomains\tpath\tsecure\texpires\tname\tvalue
   */
  async importFromNetscapeFormat(cookieFile) {
    const lines = cookieFile.split("\n").filter((l) => l && !l.startsWith("#"));
    const cookies = [];
    let domain = "";
    for (const line of lines) {
      const parts = line.split("	");
      if (parts.length >= 7) {
        const [cookieDomain, , path, secure, expires, name, value] = parts;
        if (!domain) domain = cookieDomain.replace(/^\./, "");
        cookies.push({
          name,
          value,
          domain: cookieDomain,
          path: path || "/",
          expires: expires ? parseInt(expires, 10) : void 0,
          secure: secure === "TRUE"
        });
      }
    }
    const credential = { domain, cookies };
    cookieStore.set(domain, credential);
    return credential;
  }
  /**
   * Import cookies from JSON format
   */
  async importFromJson(cookieJson) {
    const parsed = JSON.parse(cookieJson);
    const cookiesArray = Array.isArray(parsed) ? parsed : parsed.cookies || [];
    const domain = parsed.domain || (cookiesArray[0]?.domain || "").replace(/^\./, "");
    const cookies = cookiesArray.map(
      (c) => ({
        name: String(c.name || ""),
        value: String(c.value || ""),
        domain: String(c.domain || domain),
        path: String(c.path || "/"),
        expires: typeof c.expires === "number" ? c.expires : void 0,
        httpOnly: Boolean(c.httpOnly),
        secure: Boolean(c.secure),
        sameSite: c.sameSite
      })
    );
    const credential = { domain, cookies };
    cookieStore.set(domain, credential);
    return credential;
  }
  /**
   * Get cookie header string for a domain
   */
  async getCookieHeader(domain) {
    let credential = cookieStore.get(domain);
    if (!credential) {
      const parts = domain.split(".");
      for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join(".");
        credential = cookieStore.get(parentDomain);
        if (credential) break;
      }
    }
    if (!credential) return null;
    const now = Date.now() / 1e3;
    const validCookies = credential.cookies.filter(
      (c) => !c.expires || c.expires > now
    );
    if (validCookies.length === 0) return null;
    return validCookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }
  /**
   * Validate cookies are still valid for a domain
   */
  async validateCookies(domain) {
    const header = await this.getCookieHeader(domain);
    return header !== null && header.length > 0;
  }
  /**
   * Store credentials directly
   */
  storeCredential(credential) {
    cookieStore.set(credential.domain, credential);
  }
  /**
   * Remove credentials for a domain
   */
  removeCredential(domain) {
    cookieStore.delete(domain);
  }
  /**
   * List all stored domains
   */
  listDomains() {
    return Array.from(cookieStore.keys());
  }
};

// src/adapters/api-key-auth.adapter.ts
var apiKeyStore = /* @__PURE__ */ new Map();
var PLATFORM_HEADER_CONFIGS = {
  pubmed: { headerName: "api_key", headerPrefix: "" },
  semantic_scholar: { headerName: "x-api-key", headerPrefix: "" },
  reddit: { headerName: "Authorization", headerPrefix: "Bearer" }
};
var ApiKeyAuthAdapter = class {
  /**
   * Store API key for a platform
   */
  setApiKey(platform, apiKey) {
    const config = PLATFORM_HEADER_CONFIGS[platform] || {
      headerName: "Authorization",
      headerPrefix: "Bearer"
    };
    apiKeyStore.set(platform, {
      apiKey,
      headerName: config.headerName,
      headerPrefix: config.headerPrefix
    });
  }
  /**
   * Get API key credential for a platform
   */
  getCredential(platform) {
    return apiKeyStore.get(platform) || null;
  }
  /**
   * Get auth headers for a platform
   */
  getAuthHeaders(platform) {
    const credential = apiKeyStore.get(platform);
    if (!credential) return null;
    const value = credential.headerPrefix ? `${credential.headerPrefix} ${credential.apiKey}` : credential.apiKey;
    return { [credential.headerName]: value };
  }
  /**
   * Check if platform has API key configured
   */
  hasApiKey(platform) {
    return apiKeyStore.has(platform);
  }
  /**
   * Remove API key for a platform
   */
  removeApiKey(platform) {
    apiKeyStore.delete(platform);
  }
  /**
   * Validate API key works (platform-specific)
   */
  async validateApiKey(platform) {
    const credential = apiKeyStore.get(platform);
    if (!credential) return false;
    try {
      const headers = this.getAuthHeaders(platform);
      if (!headers) return false;
      const validationUrls = {
        semantic_scholar: "https://api.semanticscholar.org/graph/v1/paper/649def34f8be52c8b66281af98ae884c09aef38b",
        reddit: "https://oauth.reddit.com/api/v1/me"
      };
      const url = validationUrls[platform];
      if (!url) return true;
      const response = await fetch(url, { headers, method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }
  /**
   * List all platforms with API keys
   */
  listPlatforms() {
    return Array.from(apiKeyStore.keys());
  }
};

// src/adapters/auth-manager.adapter.ts
var credentialStore = /* @__PURE__ */ new Map();
var sessionCache = /* @__PURE__ */ new Map();
var AuthManagerAdapter = class {
  cookieAuth;
  apiKeyAuth;
  constructor() {
    this.cookieAuth = new CookieAuthAdapter();
    this.apiKeyAuth = new ApiKeyAuthAdapter();
  }
  async isAuthenticated(platform) {
    const session = await this.getSession(platform);
    return session?.isAuthenticated ?? false;
  }
  async getSession(platform) {
    const cached = sessionCache.get(platform);
    if (cached) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1e3);
      if (cached.lastChecked > fiveMinutesAgo) {
        return cached;
      }
    }
    const isValid = await this.validateCredential(platform);
    const session = {
      platform,
      isAuthenticated: isValid,
      lastChecked: /* @__PURE__ */ new Date()
    };
    sessionCache.set(platform, session);
    return session;
  }
  async listCredentials() {
    return Array.from(credentialStore.values());
  }
  async setCredential(platform, method, credential) {
    switch (method) {
      case "cookie":
        this.cookieAuth.storeCredential(credential);
        break;
      case "api_key":
        this.apiKeyAuth.setApiKey(
          platform,
          credential.apiKey
        );
        break;
      case "oauth":
        break;
      case "browser_session":
        if ("cookies" in credential) {
          this.cookieAuth.storeCredential(credential);
        }
        break;
    }
    const meta = {
      id: `${platform}-${method}`,
      platform,
      method,
      createdAt: /* @__PURE__ */ new Date(),
      isValid: true
    };
    if ("expiresAt" in credential && credential.expiresAt) {
      meta.expiresAt = credential.expiresAt;
    }
    credentialStore.set(platform, meta);
    sessionCache.delete(platform);
  }
  async removeCredential(platform) {
    const credential = credentialStore.get(platform);
    if (!credential) return;
    switch (credential.method) {
      case "cookie":
      case "browser_session":
        break;
      case "api_key":
        this.apiKeyAuth.removeApiKey(platform);
        break;
    }
    credentialStore.delete(platform);
    sessionCache.delete(platform);
  }
  async validateCredential(platform) {
    const credential = credentialStore.get(platform);
    if (!credential) return false;
    if (credential.expiresAt && credential.expiresAt < /* @__PURE__ */ new Date()) {
      credential.isValid = false;
      return false;
    }
    switch (credential.method) {
      case "api_key":
        return this.apiKeyAuth.validateApiKey(platform);
      case "cookie":
      case "browser_session":
        return true;
      // Assume valid for now
      default:
        return credential.isValid;
    }
  }
  async getAuthHeaders(platform) {
    const credential = credentialStore.get(platform);
    if (!credential) return {};
    switch (credential.method) {
      case "api_key":
        return this.apiKeyAuth.getAuthHeaders(platform) || {};
      case "oauth":
        return {};
      default:
        return {};
    }
  }
  async getAuthCookies(domain) {
    return this.cookieAuth.getCookieHeader(domain);
  }
  // ==========================================================================
  // Convenience methods
  // ==========================================================================
  getCookieAdapter() {
    return this.cookieAuth;
  }
  getApiKeyAdapter() {
    return this.apiKeyAuth;
  }
};
var authManager = null;
function getAuthManager() {
  if (!authManager) {
    authManager = new AuthManagerAdapter();
  }
  return authManager;
}

// src/adapters/academic-search.adapter.ts
import { v4 as uuid5 } from "uuid";
var resultCache = /* @__PURE__ */ new Map();
var CACHE_TTL2 = 10 * 60 * 1e3;
var AcademicSearchAdapter = class {
  apiKeyAuth;
  constructor(apiKeyAuth) {
    this.apiKeyAuth = apiKeyAuth || new ApiKeyAuthAdapter();
  }
  async search(query, options) {
    const startTime = Date.now();
    const cacheKey = `academic:${query}:${options.strategy}`;
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL2) {
      return cached.result;
    }
    const sources = [];
    const [semanticResults, arxivResults] = await Promise.allSettled([
      this.searchSemanticScholar(query, options.maxResults),
      this.searchArxiv(query, options.maxResults)
    ]);
    if (semanticResults.status === "fulfilled") {
      sources.push(...semanticResults.value);
    }
    if (arxivResults.status === "fulfilled") {
      sources.push(...arxivResults.value);
    }
    const result = {
      query,
      sources: sources.slice(0, options.maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime
    };
    resultCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
  async *searchParallel(queries, options, onProgress) {
    for (const subQuery of queries) {
      onProgress?.({
        query: subQuery.query,
        status: "searching",
        progress: 0,
        resultsFound: 0
      });
      const result = await this.search(subQuery.query, options);
      onProgress?.({
        query: subQuery.query,
        status: "completed",
        progress: 100,
        resultsFound: result.sources.length
      });
      yield result;
    }
  }
  async isAvailable() {
    try {
      const response = await fetch(
        "https://api.semanticscholar.org/graph/v1/paper/649def34f8be52c8b66281af98ae884c09aef38b?fields=title",
        {
          method: "GET",
          signal: AbortSignal.timeout(5e3)
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  getName() {
    return "academic-search";
  }
  async searchSemanticScholar(query, maxResults = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${maxResults}&fields=title,url,abstract,year,citationCount,authors`;
      const headers = {
        Accept: "application/json"
      };
      const authHeaders = this.apiKeyAuth.getAuthHeaders("semantic_scholar");
      if (authHeaders) {
        Object.assign(headers, authHeaders);
      }
      const response = await fetch(url, { headers });
      if (!response.ok) return [];
      const data = await response.json();
      const papers = data.data || [];
      return papers.map(
        (paper) => this.mapPaperToSource(paper, "semantic_scholar")
      );
    } catch {
      return [];
    }
  }
  async searchArxiv(query, maxResults = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const text = await response.text();
      return this.parseArxivXml(text);
    } catch {
      return [];
    }
  }
  parseArxivXml(xml) {
    const results = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const getId = (tag) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };
      const title = getId("title").replace(/\s+/g, " ");
      const summary = getId("summary").replace(/\s+/g, " ");
      const id = getId("id");
      const published = getId("published");
      if (title && id) {
        results.push({
          id: uuid5(),
          url: id,
          title,
          snippet: summary.slice(0, 300),
          domain: "arxiv.org",
          sourceType: "academic",
          credibilityScore: 0.88,
          relevanceScore: 0.8,
          media: [],
          requiresAuth: false,
          publishedAt: published ? new Date(published) : void 0
        });
      }
    }
    return results;
  }
  mapPaperToSource(paper, source) {
    const authors = Array.isArray(paper.authors) ? paper.authors.map(
      (a) => a.name || ""
    ) : [];
    return {
      id: uuid5(),
      url: paper.url || `https://semanticscholar.org/paper/${paper.paperId}`,
      title: paper.title || "Untitled",
      snippet: (paper.abstract || "").slice(0, 300),
      domain: source === "semantic_scholar" ? "semanticscholar.org" : "arxiv.org",
      sourceType: "academic",
      credibilityScore: this.calculateAcademicCredibility(paper),
      relevanceScore: 0.8,
      media: [],
      requiresAuth: false,
      author: authors.join(", "),
      publishedAt: paper.year ? /* @__PURE__ */ new Date(`${paper.year}-01-01`) : void 0
    };
  }
  calculateAcademicCredibility(paper) {
    let score = 0.8;
    const citations = paper.citationCount;
    if (typeof citations === "number") {
      if (citations > 100) score += 0.1;
      else if (citations > 50) score += 0.07;
      else if (citations > 10) score += 0.05;
    }
    const year = paper.year;
    if (typeof year === "number" && year >= (/* @__PURE__ */ new Date()).getFullYear() - 2) {
      score += 0.02;
    }
    return Math.min(score, 0.95);
  }
};

// src/adapters/news-search.adapter.ts
import { v4 as uuid6 } from "uuid";
var newsCache = /* @__PURE__ */ new Map();
var CACHE_TTL3 = 5 * 60 * 1e3;
var NewsSearchAdapter = class {
  async search(query, options) {
    const startTime = Date.now();
    const cacheKey = `news:${query}`;
    const cached = newsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL3) {
      return cached.result;
    }
    const maxResults = options.maxResults || 15;
    const sources = await this.searchGoogleNews(query, maxResults);
    const result = {
      query,
      sources: sources.slice(0, maxResults),
      totalFound: sources.length,
      durationMs: Date.now() - startTime
    };
    newsCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
  async *searchParallel(queries, options, onProgress) {
    for (const subQuery of queries) {
      onProgress?.({
        query: subQuery.query,
        status: "searching",
        progress: 0,
        resultsFound: 0
      });
      const result = await this.search(subQuery.query, options);
      onProgress?.({
        query: subQuery.query,
        status: "completed",
        progress: 100,
        resultsFound: result.sources.length
      });
      yield result;
    }
  }
  async isAvailable() {
    try {
      const response = await fetch(
        "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
        {
          method: "GET",
          signal: AbortSignal.timeout(5e3)
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  getName() {
    return "news-search";
  }
  async searchGoogleNews(query, maxResults) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const xml = await response.text();
      return this.parseRssXml(xml, maxResults);
    } catch {
      return [];
    }
  }
  parseRssXml(xml, maxResults) {
    const results = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && results.length < maxResults) {
      const item = match[1];
      const getTag = (tag) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };
      const getCdata = (tag) => {
        const m = item.match(
          new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
        );
        return m ? m[1].trim() : getTag(tag);
      };
      const title = getCdata("title").replace(/\s+/g, " ");
      let link = getTag("link");
      const pubDate = getTag("pubDate");
      const description = getCdata("description").replace(/<[^>]*>/g, "").slice(0, 300);
      let source = "News";
      const sourceMatch = title.match(/\s-\s([^-]+)$/);
      if (sourceMatch) {
        source = sourceMatch[1].trim();
      }
      if (link.includes("news.google.com")) {
        const urlMatch = item.match(/url=([^&"]+)/);
        if (urlMatch) {
          link = decodeURIComponent(urlMatch[1]);
        }
      }
      if (title && link) {
        const domain = this.extractDomainFromSource(source);
        results.push({
          id: uuid6(),
          url: link,
          title: title.replace(/\s-\s[^-]+$/, ""),
          // Remove source suffix
          snippet: description,
          domain,
          sourceType: "news",
          credibilityScore: this.estimateNewsCredibility(source, link),
          relevanceScore: 0.75,
          media: [],
          requiresAuth: false,
          publishedAt: pubDate ? new Date(pubDate) : void 0
        });
      }
    }
    return results;
  }
  extractDomainFromSource(source) {
    const sourceLower = source.toLowerCase();
    const domainMap = {
      reuters: "reuters.com",
      bbc: "bbc.com",
      "bbc news": "bbc.com",
      npr: "npr.org",
      "new york times": "nytimes.com",
      nyt: "nytimes.com",
      "washington post": "washingtonpost.com",
      guardian: "theguardian.com",
      cnn: "cnn.com",
      "associated press": "apnews.com",
      ap: "apnews.com",
      bloomberg: "bloomberg.com"
    };
    for (const [key, domain] of Object.entries(domainMap)) {
      if (sourceLower.includes(key)) {
        return domain;
      }
    }
    return source.toLowerCase().replace(/\s+/g, "") + ".com";
  }
  estimateNewsCredibility(source, url) {
    const sourceLower = source.toLowerCase();
    let domain = "";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }
    const highCredibility = [
      "reuters",
      "bbc",
      "npr",
      "associated press",
      "ap news",
      "bloomberg",
      "economist",
      "financial times"
    ];
    const mediumHigh = [
      "new york times",
      "washington post",
      "guardian",
      "wall street journal",
      "cnn",
      "abc news",
      "nbc news"
    ];
    for (const src of highCredibility) {
      if (sourceLower.includes(src) || domain.includes(src.replace(/\s+/g, ""))) {
        return 0.88;
      }
    }
    for (const src of mediumHigh) {
      if (sourceLower.includes(src) || domain.includes(src.replace(/\s+/g, ""))) {
        return 0.82;
      }
    }
    return 0.7;
  }
};

// src/adapters/ai-sdk-llm.adapter.ts
import { generateText, embed, Output } from "ai";
var AiSdkLlmAdapter = class {
  constructor(options) {
    this.options = options;
  }
  async generate(prompt, schema, options) {
    const result = await generateText({
      model: this.options.model,
      output: Output.object({ schema }),
      prompt,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxTokens
    });
    return {
      data: result.output,
      usage: {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0
      }
    };
  }
  async generateText(prompt, options) {
    const result = await generateText({
      model: this.options.model,
      prompt,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxTokens
    });
    return result.text;
  }
  async *streamText(prompt, options) {
    const text = await this.generateText(prompt, options);
    yield text;
  }
  async embed(text) {
    if (!this.options.embeddingModel) {
      throw new Error("Embedding model not configured");
    }
    const result = await embed({
      model: this.options.embeddingModel,
      value: text
    });
    return result.embedding;
  }
  async similarity(text1, text2) {
    const [emb1, emb2] = await Promise.all([
      this.embed(text1),
      this.embed(text2)
    ]);
    return this.cosineSimilarity(emb1, emb2);
  }
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
};

// src/adapters/vectorless-kb.adapter.ts
var VectorlessKnowledgeBaseAdapter = class {
  constructor(llm, options) {
    this.llm = llm;
    this.enabled = options?.enabled ?? true;
  }
  chunks = /* @__PURE__ */ new Map();
  documents = /* @__PURE__ */ new Map();
  enabled;
  isEnabled() {
    return this.enabled;
  }
  async indexDocuments(documents, options) {
    if (!this.enabled) return { indexed: 0, failed: 0 };
    const maxTokensPerNode = options?.maxTokensPerNode ?? 2e3;
    let indexed = 0;
    let failed = 0;
    for (const doc of documents) {
      try {
        this.documents.set(doc.id, doc);
        const chunks = this.chunkContent(doc.content, maxTokensPerNode);
        const storedChunks = chunks.map((chunk, i) => ({
          documentId: doc.id,
          chunk,
          metadata: {
            ...doc.metadata,
            chunkIndex: i,
            url: doc.url,
            title: doc.title
          }
        }));
        this.chunks.set(doc.id, storedChunks);
        indexed++;
      } catch {
        failed++;
      }
    }
    return { indexed, failed };
  }
  async query(query, options) {
    if (!this.enabled) return [];
    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0.3;
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);
    const results = [];
    for (const [docId, chunks] of this.chunks) {
      for (const chunk of chunks) {
        const score = this.calculateRelevance(chunk.chunk, queryTerms);
        if (score >= minScore) {
          results.push({
            documentId: docId,
            chunk: chunk.chunk,
            score,
            metadata: chunk.metadata
          });
        }
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }
  async *generateReport(query, context) {
    const relevantChunks = await this.query(query, { topK: 20, minScore: 0.2 });
    const knowledgeContext = relevantChunks.map((r) => `[Source: ${r.metadata.title ?? "Unknown"}]
${r.chunk}`).join("\n\n---\n\n");
    const findingsText = context.findings.slice(0, 15).join("\n- ");
    const sourcesText = context.sources.slice(0, 20).map((s) => `- ${s.title}: ${s.url}`).join("\n");
    const prompt = `You are a research analyst writing a comprehensive, detailed report.

RESEARCH QUERY: ${query}

MAIN TOPICS: ${context.topics.join(", ")}

KEY FINDINGS:
- ${findingsText}

KNOWLEDGE BASE CONTENT:
${knowledgeContext}

SOURCES:
${sourcesText}

Write a comprehensive, well-structured research report that:
1. Has an executive summary
2. Covers all main topics in depth with multiple sections
3. Includes specific data, statistics, and quotes from sources
4. Provides analysis and insights
5. Has a conclusion with key takeaways
6. Uses proper citations [Source Name]

The report should be detailed, professional, and at least 2000 words.
Use markdown formatting with headers, bullet points, and emphasis.`;
    let fullContent = "";
    for await (const chunk of this.llm.streamText(prompt, {
      maxTokens: 16e3,
      temperature: 0.7
    })) {
      fullContent += chunk;
      yield { type: "chunk", content: chunk };
    }
    yield { type: "complete", content: fullContent };
  }
  async clear(sessionId) {
    this.chunks.clear();
    this.documents.clear();
  }
  chunkContent(content, maxTokens) {
    const chunks = [];
    const charsPerToken = 4;
    const maxChars = maxTokens * charsPerToken;
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = "";
    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        if (para.length > maxChars) {
          const sentences = para.split(/(?<=[.!?])\s+/);
          currentChunk = "";
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChars) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = sentence + " ";
            } else {
              currentChunk += sentence + " ";
            }
          }
        } else {
          currentChunk = para + "\n\n";
        }
      } else {
        currentChunk += para + "\n\n";
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
  calculateRelevance(text, queryTerms) {
    const textLower = text.toLowerCase();
    let matches = 0;
    let totalWeight = 0;
    for (const term of queryTerms) {
      const weight = term.length > 5 ? 2 : 1;
      if (textLower.includes(term)) {
        matches += weight;
      }
      totalWeight += weight;
    }
    const lengthBonus = Math.min(text.length / 1e3, 0.2);
    return totalWeight > 0 ? matches / totalWeight * 0.8 + lengthBonus : 0;
  }
};

// src/agent/deep-research-agent.ts
import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { z as z11 } from "zod";
import { WebSearchUseCase, OneCrawlSearchAdapter, OneCrawlScraperAdapter } from "@onegenui/web-search";
var DEFAULT_MAX_TOKENS = 65e3;
var webSearchInstance = null;
function getWebSearchUseCase() {
  if (!webSearchInstance) {
    webSearchInstance = new WebSearchUseCase(
      [new OneCrawlSearchAdapter()],
      [new OneCrawlScraperAdapter()],
      { maxRetries: 2, initialDelay: 1e3, backoffMultiplier: 2, maxDelay: 5e3 }
    );
  }
  return webSearchInstance;
}
function createDeepResearchAgent(options) {
  const { model, effort, onProgress, maxTokens = DEFAULT_MAX_TOKENS } = options;
  const effortConfig = EFFORT_PRESETS[effort];
  const webSearch = getWebSearchUseCase();
  const state = {
    sources: /* @__PURE__ */ new Map(),
    scrapedContent: /* @__PURE__ */ new Map(),
    findings: [],
    startTime: Date.now()
  };
  const researchTools = {
    webSearch: tool({
      description: "Search the web for information on a specific query. Returns URLs and snippets.",
      inputSchema: z11.object({
        query: z11.string().describe("The search query"),
        searchType: z11.enum(["web", "news"]).default("web")
      }),
      execute: async ({ query, searchType }) => {
        onProgress?.({
          type: "phase-started",
          timestamp: /* @__PURE__ */ new Date(),
          researchId: "agent",
          phase: "searching",
          message: `Searching: ${query}`
        });
        try {
          const response = await webSearch.search(query, {
            maxResults: Math.min(10, Math.ceil(effortConfig.maxSources / 3)),
            searchType,
            timeout: 45e3,
            cache: true
          });
          const results = response.results.results || [];
          for (const result of results) {
            if (result.url && !state.sources.has(result.url)) {
              const urlObj = new URL(result.url);
              state.sources.set(result.url, {
                url: result.url,
                title: result.title || urlObj.hostname,
                domain: urlObj.hostname.replace("www.", ""),
                snippet: result.snippet
              });
            }
          }
          return {
            found: results.length,
            sources: results.slice(0, 8).map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet
            }))
          };
        } catch (error) {
          return {
            found: 0,
            sources: [],
            error: error instanceof Error ? error.message : "Search failed"
          };
        }
      }
    }),
    scrapeContent: tool({
      description: "Extract content from a URL. Use after finding relevant sources.",
      inputSchema: z11.object({
        url: z11.string().url().describe("The URL to scrape")
      }),
      execute: async ({ url }) => {
        onProgress?.({
          type: "progress-update",
          timestamp: /* @__PURE__ */ new Date(),
          researchId: "agent",
          progress: state.scrapedContent.size / effortConfig.maxSources,
          message: `Extracting: ${new URL(url).hostname}`,
          stats: {
            sourcesFound: state.sources.size,
            sourcesProcessed: state.scrapedContent.size,
            stepsCompleted: 0,
            totalSteps: 0
          }
        });
        try {
          const response = await webSearch.scrape(url, {
            timeout: 2e4,
            maxContentLength: 25e3,
            cache: true
          });
          const content = response.result.content;
          if (content) {
            state.scrapedContent.set(url, content);
            return {
              success: true,
              title: response.result.title,
              wordCount: content.split(/\s+/).length,
              excerpt: content.slice(0, 1e3)
            };
          }
          return { success: false, error: "No content extracted" };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Scrape failed"
          };
        }
      }
    }),
    recordFinding: tool({
      description: "Record an important finding from the research. Use when you discover key information.",
      inputSchema: z11.object({
        finding: z11.string().describe("The key finding or insight"),
        source: z11.string().optional().describe("The source URL this finding came from")
      }),
      execute: async ({ finding, source }) => {
        state.findings.push(finding);
        onProgress?.({
          type: "finding-discovered",
          timestamp: /* @__PURE__ */ new Date(),
          researchId: "agent",
          finding,
          confidence: "medium",
          sourceIds: source ? [source] : []
        });
        return { recorded: true, totalFindings: state.findings.length };
      }
    }),
    getResearchStatus: tool({
      description: "Get the current status of the research. Use to check progress.",
      inputSchema: z11.object({}),
      execute: async () => ({
        sourcesFound: state.sources.size,
        sourcesScraped: state.scrapedContent.size,
        findingsRecorded: state.findings.length,
        targetSources: effortConfig.maxSources,
        elapsedMs: Date.now() - state.startTime
      })
    })
  };
  const agent = new ToolLoopAgent({
    model,
    instructions: buildInstructions(effort, effortConfig),
    tools: researchTools,
    stopWhen: stepCountIs(effortConfig.maxSteps),
    maxOutputTokens: maxTokens,
    prepareStep: async ({ stepNumber }) => {
      if (stepNumber <= 3) {
        return {
          activeTools: ["webSearch", "getResearchStatus"],
          toolChoice: { type: "tool", toolName: "webSearch" }
          // Force search initially
        };
      }
      return {
        activeTools: ["webSearch", "scrapeContent", "recordFinding", "getResearchStatus"]
      };
    },
    onStepFinish: (step) => {
      const stepCount = state.stepCount ?? 0;
      state.stepCount = stepCount + 1;
      onProgress?.({
        type: "progress-update",
        timestamp: /* @__PURE__ */ new Date(),
        researchId: "agent",
        progress: Math.min(0.95, stepCount / effortConfig.maxSteps),
        message: `Step ${stepCount + 1} complete`,
        stats: {
          sourcesFound: state.sources.size,
          sourcesProcessed: state.scrapedContent.size,
          stepsCompleted: stepCount + 1,
          totalSteps: effortConfig.maxSteps
        }
      });
    }
  });
  return {
    agent,
    state,
    async research(query, context) {
      const prompt = context ? `Research query: ${query}

Additional context: ${context}` : `Research query: ${query}`;
      onProgress?.({
        type: "phase-started",
        timestamp: /* @__PURE__ */ new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Starting research..."
      });
      const result = await agent.generate({ prompt });
      onProgress?.({
        type: "completed",
        timestamp: /* @__PURE__ */ new Date(),
        researchId: "agent",
        totalDurationMs: Date.now() - state.startTime,
        finalQuality: state.findings.length > 0 ? 0.8 : 0.5
      });
      return {
        synthesis: result.text,
        sources: Array.from(state.sources.values()),
        stats: {
          totalSources: state.sources.size,
          sourcesProcessed: state.scrapedContent.size,
          durationMs: Date.now() - state.startTime
        },
        quality: Math.min(1, state.findings.length / 10)
      };
    }
  };
}
function buildInstructions(effort, config) {
  return `You are a DEEP RESEARCH agent. Your mission is to conduct EXHAUSTIVE research on the given query.

## EFFORT LEVEL: ${effort.toUpperCase()}
- **MINIMUM sources to find**: ${config.maxSources}
- **MINIMUM sources to scrape**: ${Math.ceil(config.maxSources * 0.5)}
- **Target steps**: ${config.maxSteps}

## MANDATORY RESEARCH PHASES

### PHASE 1: BROAD SEARCH (steps 1-5)
You MUST perform at least 5 different web searches with varied queries:
- Original query in different phrasings
- Related academic/technical terms
- Different languages if relevant
- News and current events angle

### PHASE 2: DEEP EXTRACTION (steps 6-${Math.ceil(config.maxSteps * 0.7)})
You MUST scrape content from AT LEAST ${Math.ceil(config.maxSources * 0.5)} of the found sources.
- Use scrapeContent on EVERY promising URL
- Extract and analyze the actual content
- Do NOT skip this phase - web snippets are not enough

### PHASE 3: ANALYSIS (ongoing)
For EACH scraped source, use recordFinding to log:
- Key facts and statistics
- Expert opinions
- Contradictions between sources
- Unique insights

### PHASE 4: SYNTHESIS (final - CRITICAL)
After ALL research is complete, write a COMPREHENSIVE synthesis that:
- Is AT LEAST 2000-3000 words long
- Includes multiple sections with headers
- Cites sources inline using [source domain] format
- Covers ALL angles: historical, current state, different perspectives
- Includes comparisons, contrasts, and nuanced analysis
- Draws conclusions based on the evidence

## CRITICAL RULES
1. DO NOT finish early - use all available steps
2. DO NOT rely only on search snippets - SCRAPE the actual pages
3. DO NOT skip scrapeContent - it's essential for deep research
4. Check getResearchStatus regularly to track progress
5. If sourcesScraped < ${Math.ceil(config.maxSources * 0.3)}, keep scraping more URLs
6. Your final synthesis MUST be comprehensive and cite multiple sources

Your research quality depends on ACTUALLY READING the sources and writing a DETAILED synthesis.`;
}

// src/factory.ts
function createDeepResearch(factoryOptions) {
  const { model, maxTokens } = factoryOptions;
  return {
    async researchAsync(query, options) {
      const agent = createDeepResearchAgent({
        model,
        effort: options.effort,
        abortSignal: options.abortSignal,
        onProgress: options.onProgress,
        maxTokens
      });
      return agent.research(query, options.context);
    },
    async *research(query, options) {
      const events = [];
      const agent = createDeepResearchAgent({
        model,
        effort: options.effort,
        abortSignal: options.abortSignal,
        maxTokens,
        onProgress: (event) => {
          events.push(event);
        }
      });
      const resultPromise = agent.research(query, options.context);
      yield {
        type: "phase-started",
        timestamp: /* @__PURE__ */ new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Initializing research agent..."
      };
      const result = await resultPromise;
      for (const event of events) {
        yield event;
      }
      yield {
        type: "completed",
        timestamp: /* @__PURE__ */ new Date(),
        researchId: "agent",
        totalDurationMs: result.stats.durationMs,
        finalQuality: result.quality
      };
      return result;
    }
  };
}
export {
  AcademicSearchAdapter,
  AiSdkLlmAdapter,
  ApiKeyAuthAdapter,
  ApiKeyCredentialSchema,
  AuthManagerAdapter,
  AuthMethodSchema,
  AuthSessionSchema,
  BaseEventSchema,
  CREDIBILITY_TIERS,
  ChartConfigSchema,
  CitationSchema,
  CompletedEventSchema,
  ConflictSchema,
  ContentAnalyzerAdapter,
  CookieAuthAdapter,
  CookieCredentialSchema,
  CredentialSchema,
  CredibilityTierSchema,
  DEFAULT_GRAPH_OPTIONS,
  DEFAULT_RANKING_WEIGHTS,
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_SCRAPING_CONFIG,
  DEFAULT_SEARCH_CONFIG,
  DEFAULT_SYNTHESIS_OPTIONS,
  DeepResearchUseCase,
  DeepSearchAdapter,
  EFFORT_PRESETS,
  EFFORT_TIMING,
  EffortConfigSchema,
  EffortLevelSchema,
  EntitySchema,
  EntityTypeSchema,
  ErrorEventSchema,
  FindingDiscoveredEventSchema,
  JS_REQUIRED_DOMAINS,
  KeyFindingSchema,
  KnowledgeGraphAdapter,
  KnowledgeGraphSchema,
  LightweightScraperAdapter,
  MediaItemSchema,
  MindMapNodeSchema,
  MindMapSchema,
  NewsSearchAdapter,
  OAuthConfigSchema,
  OAuthTokenSchema,
  PLATFORM_AUTH_CONFIGS,
  PhaseCompletedEventSchema,
  PhaseStartedEventSchema,
  PlatformSchema,
  ProgressUpdateEventSchema,
  QualityCheckEventSchema,
  QualityScoreSchema,
  QualityScoringWeightsSchema,
  QueryDecomposer,
  RESEARCH_PHASES,
  RankedSourceSchema,
  RelationshipSchema,
  RelationshipTypeSchema,
  ResearchEventSchema,
  ResearchOrchestrator,
  ResearchPhaseSchema,
  ResearchQuerySchema,
  ResearchResultSchema,
  ResearchStatsSchema,
  ResearchStatusSchema,
  ScrapingConfigSchema,
  SearchConfigSchema,
  SearchStrategySchema,
  SectionSchema,
  SourceExtractedEventSchema,
  SourceFoundEventSchema,
  SourceRankerAdapter,
  SourceSchema,
  SourceTypeSchema,
  StepCompletedEventSchema,
  StepStartedEventSchema,
  SubQuerySchema,
  SynthesisSchema,
  SynthesizerAdapter,
  TimelineEventSchema,
  VectorlessKnowledgeBaseAdapter,
  createDeepResearch,
  createDeepResearchAgent,
  createDeepResearchTools,
  getAuthManager,
  getDomainCredibility,
  getResearchConfig,
  requiresJavaScript
};
