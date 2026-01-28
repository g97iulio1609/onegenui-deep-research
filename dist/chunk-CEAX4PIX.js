// src/tools.ts
import { z as z3 } from "zod";

// src/domain/effort-level.schema.ts
import { z } from "zod";
var EffortLevelSchema = z.enum(["standard", "deep", "max"]);
var EffortConfigSchema = z.object({
  level: EffortLevelSchema,
  maxSteps: z.number().min(20).max(200),
  timeoutMs: z.number().min(12e4).max(27e5),
  // 2min - 45min
  maxSources: z.number().min(10).max(100),
  parallelism: z.number().min(5).max(20),
  recursionDepth: z.number().min(1).max(3),
  enableAuth: z.boolean(),
  enableVisualizations: z.boolean(),
  autoStopOnQuality: z.boolean(),
  qualityThreshold: z.number().min(0.7).max(1)
});
var EFFORT_PRESETS = {
  standard: {
    level: "standard",
    maxSteps: 50,
    timeoutMs: 3e5,
    // 5 min
    maxSources: 25,
    parallelism: 10,
    recursionDepth: 1,
    enableAuth: false,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.75
  },
  deep: {
    level: "deep",
    maxSteps: 100,
    timeoutMs: 9e5,
    // 15 min
    maxSources: 50,
    parallelism: 15,
    recursionDepth: 2,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.8
  },
  max: {
    level: "max",
    maxSteps: 200,
    timeoutMs: 27e5,
    // 45 min
    maxSources: 100,
    parallelism: 20,
    recursionDepth: 3,
    enableAuth: true,
    enableVisualizations: true,
    autoStopOnQuality: true,
    qualityThreshold: 0.9
  }
};

// src/use-cases/orchestrator.ts
import { v4 as uuid2 } from "uuid";
import pLimit from "p-limit";

// src/use-cases/query-decomposer.ts
import { v4 as uuid } from "uuid";
import { z as z2 } from "zod";
var DecompositionSchema = z2.object({
  refinedQuery: z2.string(),
  mainTopics: z2.array(z2.string()),
  subQueries: z2.array(
    z2.object({
      query: z2.string(),
      purpose: z2.string(),
      strategy: z2.enum([
        "broad",
        "academic",
        "news",
        "technical",
        "social",
        "official"
      ]),
      priority: z2.number().min(1).max(10)
    })
  ),
  temporalFocus: z2.enum(["recent", "historical", "all", "specific"]),
  language: z2.string()
});
var QueryDecomposer = class {
  constructor(llm) {
    this.llm = llm;
  }
  async decompose(query, effort, context) {
    const subQueryCount = this.getSubQueryCount(effort);
    const prompt = this.buildPrompt(query, subQueryCount, context);
    const result = await this.llm.generate(prompt, DecompositionSchema);
    const subQueries = result.data.subQueries.map((sq, index) => ({
      id: uuid(),
      query: sq.query,
      purpose: sq.purpose,
      strategy: sq.strategy,
      priority: sq.priority,
      depth: 0
    }));
    return {
      id: uuid(),
      originalQuery: query,
      refinedQuery: result.data.refinedQuery,
      mainTopics: result.data.mainTopics,
      subQueries,
      temporalFocus: result.data.temporalFocus,
      language: result.data.language,
      effort,
      context,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  getSubQueryCount(effort) {
    switch (effort.level) {
      case "standard":
        return 5;
      case "deep":
        return 10;
      case "max":
        return 15;
    }
  }
  buildPrompt(query, subQueryCount, context) {
    return `You are a research query decomposer. Break down the following query into sub-queries for comprehensive research.

QUERY: "${query}"
${context ? `CONTEXT: ${context}` : ""}

Generate exactly ${subQueryCount} sub-queries that cover different aspects and perspectives.

Requirements:
1. Each sub-query should target a specific aspect of the main query
2. Use different search strategies appropriately:
   - "broad": General web search
   - "academic": Scientific papers, research (arxiv, pubmed, scholar)
   - "news": Recent news and developments
   - "technical": Code, documentation, technical specs
   - "social": Discussions, opinions, community insights
   - "official": Government, official organizations
3. Assign priority 1-10 (10 = most important)
4. Identify the temporal focus (recent events vs historical)
5. Detect the primary language

Return a JSON object with:
- refinedQuery: An improved version of the original query
- mainTopics: Array of 3-5 main topics covered
- subQueries: Array of sub-queries with query, purpose, strategy, priority
- temporalFocus: "recent" | "historical" | "all" | "specific"
- language: ISO language code (e.g., "en", "it", "es")`;
  }
};

// src/use-cases/orchestrator.ts
var ResearchOrchestrator = class {
  constructor(ports, config) {
    this.ports = ports;
    this.config = config;
    this.state = this.initState();
    this.decomposer = new QueryDecomposer(ports.llm);
    this.parallelLimit = pLimit(config.effort.parallelism);
  }
  state;
  decomposer;
  parallelLimit;
  async *execute(queryText, context) {
    this.state = this.initState();
    const { researchId } = this.state;
    try {
      yield this.phaseStarted(
        "decomposing",
        "Decomposing query into sub-queries"
      );
      const query = await this.decomposer.decompose(
        queryText,
        this.config.effort,
        context
      );
      this.state.query = query;
      this.state.totalSteps = this.calculateTotalSteps(query);
      yield this.phaseCompleted("decomposing");
      yield this.phaseStarted(
        "searching",
        `Searching ${query.subQueries.length} queries in parallel`
      );
      yield* this.executeSearchPhase(query);
      yield this.phaseCompleted("searching");
      if (this.shouldStop()) {
        return this.buildResult("stopped");
      }
      yield this.phaseStarted("ranking", "Ranking and selecting sources");
      await this.executeRankingPhase(query);
      yield this.phaseCompleted("ranking");
      yield this.phaseStarted(
        "extracting",
        `Extracting content from ${this.state.rankedSources.length} sources`
      );
      yield* this.executeExtractionPhase();
      yield this.phaseCompleted("extracting");
      yield this.phaseStarted(
        "analyzing",
        "Analyzing content and extracting insights"
      );
      yield* this.executeAnalysisPhase(query);
      yield this.phaseCompleted("analyzing");
      const quality = await this.assessQuality();
      this.state.quality = quality;
      yield this.qualityCheck(quality);
      if (quality.isSOTA && this.config.effort.autoStopOnQuality) {
        yield this.phaseStarted(
          "synthesizing",
          "SOTA quality reached - generating report"
        );
      } else {
        if (this.config.effort.recursionDepth > 1 && !quality.isSOTA) {
          yield* this.executeRecursiveSearch(query);
        }
        yield this.phaseStarted(
          "synthesizing",
          "Generating comprehensive report"
        );
      }
      const synthesis = yield* this.executeSynthesisPhase(query);
      yield this.phaseCompleted("synthesizing");
      let knowledgeGraph, mindMap, charts, timeline;
      if (this.config.effort.enableVisualizations) {
        yield this.phaseStarted("visualizing", "Generating visualizations");
        const visualizations = await this.executeVisualizationPhase(query);
        knowledgeGraph = visualizations.graph;
        mindMap = visualizations.mindMap;
        charts = visualizations.charts;
        timeline = visualizations.timeline;
        yield this.phaseCompleted("visualizing");
      }
      yield {
        type: "completed",
        timestamp: /* @__PURE__ */ new Date(),
        researchId,
        totalDurationMs: Date.now() - this.state.startTime,
        finalQuality: this.state.quality?.overall ?? 0
      };
      return {
        id: researchId,
        query,
        status: "completed",
        progress: 1,
        currentPhase: "completed",
        sources: Array.from(this.state.sources.values()),
        synthesis,
        knowledgeGraph,
        mindMap,
        charts: charts ?? [],
        timeline: timeline ?? [],
        quality: this.state.quality ?? void 0,
        stats: {
          totalSources: this.state.sources.size,
          sourcesProcessed: this.state.scrapedContent.size,
          stepsCompleted: this.state.stepsCompleted,
          totalSteps: this.state.totalSteps,
          searchQueries: query.subQueries.length,
          pagesExtracted: this.state.scrapedContent.size,
          durationMs: Date.now() - this.state.startTime
        },
        startedAt: new Date(this.state.startTime),
        completedAt: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      yield {
        type: "error",
        timestamp: /* @__PURE__ */ new Date(),
        researchId,
        error: error instanceof Error ? error.message : "Unknown error",
        recoverable: false
      };
      return this.buildResult(
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  async *executeSearchPhase(query) {
    const { researchId } = this.state;
    const searchOptions = {
      maxResults: Math.ceil(
        this.config.effort.maxSources / query.subQueries.length
      ),
      timeout: 3e4,
      strategy: "broad"
    };
    let parallelGroup = 0;
    const batches = this.batchQueries(
      query.subQueries,
      this.config.effort.parallelism
    );
    for (const batch of batches) {
      parallelGroup++;
      const tasks = batch.map(
        (subQuery) => this.parallelLimit(async () => {
          const result = await this.ports.search.search(subQuery.query, {
            ...searchOptions,
            strategy: subQuery.strategy
          });
          for (const source of result.sources) {
            if (!this.state.sources.has(source.url)) {
              this.state.sources.set(source.url, source);
            }
          }
          return result;
        })
      );
      yield {
        type: "step-started",
        timestamp: /* @__PURE__ */ new Date(),
        researchId,
        stepId: `search-batch-${parallelGroup}`,
        stepType: "search",
        description: `Searching ${batch.length} queries`,
        parallelGroup
      };
      await Promise.all(tasks);
      this.state.stepsCompleted += batch.length;
      yield {
        type: "step-completed",
        timestamp: /* @__PURE__ */ new Date(),
        researchId,
        stepId: `search-batch-${parallelGroup}`,
        success: true,
        durationMs: 0,
        resultSummary: `Found ${this.state.sources.size} unique sources`
      };
      yield this.progressUpdate(`Completed search batch ${parallelGroup}`);
    }
  }
  async executeRankingPhase(query) {
    const sources = Array.from(this.state.sources.values());
    this.state.rankedSources = await this.ports.ranker.rank(sources, {
      query: query.originalQuery,
      topics: query.mainTopics,
      preferRecent: query.temporalFocus === "recent"
    });
    this.state.rankedSources = this.state.rankedSources.slice(
      0,
      this.config.effort.maxSources
    );
    this.state.rankedSources = this.ports.ranker.diversify(
      this.state.rankedSources,
      3
      // Max 3 per domain
    );
    this.state.stepsCompleted++;
  }
  async *executeExtractionPhase() {
    const { researchId } = this.state;
    const scrapeOptions = {
      timeout: 15e3,
      extractMedia: true,
      maxContentLength: 5e4
    };
    const urls = this.state.rankedSources.filter((s) => this.ports.scraper.canScrapeWithoutBrowser(s.url)).map((s) => s.url);
    let scraped = 0;
    for await (const content of this.ports.scraper.scrapeMany(
      urls,
      scrapeOptions
    )) {
      if (content.success) {
        this.state.scrapedContent.set(content.url, content);
        yield {
          type: "source-extracted",
          timestamp: /* @__PURE__ */ new Date(),
          researchId,
          sourceId: this.state.sources.get(content.url)?.id ?? "",
          wordCount: content.wordCount,
          mediaCount: content.media.length
        };
      }
      scraped++;
      if (scraped % 5 === 0) {
        yield this.progressUpdate(`Extracted ${scraped}/${urls.length} pages`);
      }
    }
    this.state.stepsCompleted += Math.ceil(urls.length / 5);
  }
  async *executeAnalysisPhase(query) {
    const { researchId } = this.state;
    const contents = Array.from(this.state.scrapedContent.entries());
    const batches = this.batchArray(contents, 5);
    for (const batch of batches) {
      const tasks = batch.map(
        ([url, content]) => this.parallelLimit(async () => {
          const source = this.state.sources.get(url);
          if (!source) return null;
          const analyzed = await this.ports.analyzer.analyze(content.content, {
            query: query.originalQuery,
            topics: query.mainTopics,
            sourceId: source.id
          });
          this.state.analyzedContent.set(source.id, analyzed);
          for (const keyPoint of analyzed.keyPoints.slice(0, 2)) {
            return {
              type: "finding-discovered",
              timestamp: /* @__PURE__ */ new Date(),
              researchId,
              finding: keyPoint,
              confidence: "medium",
              sourceIds: [source.id]
            };
          }
          return null;
        })
      );
      const results = await Promise.all(tasks);
      for (const event of results) {
        if (event) yield event;
      }
      this.state.stepsCompleted++;
      yield this.progressUpdate(
        `Analyzed ${this.state.analyzedContent.size} sources`
      );
    }
  }
  async *executeRecursiveSearch(query) {
    const findings = Array.from(this.state.analyzedContent.values()).flatMap((a) => a.keyPoints).slice(0, 5);
    if (findings.length === 0) return;
    const followUpQueries = findings.map((finding, i) => ({
      id: uuid2(),
      query: `${query.originalQuery} ${finding}`,
      purpose: `Deep dive into: ${finding}`,
      strategy: "broad",
      priority: 5,
      depth: 1
    }));
    yield this.phaseStarted(
      "searching",
      "Executing recursive search for deeper insights"
    );
    for await (const result of this.ports.search.searchParallel(
      followUpQueries,
      { maxResults: 5, timeout: 2e4, strategy: "broad" }
    )) {
      for (const source of result.sources) {
        if (!this.state.sources.has(source.url)) {
          this.state.sources.set(source.url, source);
        }
      }
    }
    yield this.phaseCompleted("searching");
  }
  async *executeSynthesisPhase(query) {
    const contents = Array.from(this.state.analyzedContent.values());
    const sources = Array.from(this.state.sources.values());
    let synthesis;
    for await (const event of this.ports.synthesizer.synthesize(
      contents,
      sources,
      query
    )) {
      if (event.type === "complete") {
        synthesis = event.data;
      }
    }
    if (!synthesis) {
      throw new Error("Synthesis failed to complete");
    }
    return synthesis;
  }
  async executeVisualizationPhase(query) {
    const contents = Array.from(this.state.analyzedContent.values());
    const graph = await this.ports.graph.build(contents);
    const mindMap = this.ports.graph.toMindMap(
      graph,
      query.mainTopics[0] || query.originalQuery
    );
    return {
      graph,
      mindMap,
      charts: [],
      // TODO: Implement chart generation
      timeline: []
      // TODO: Implement timeline extraction
    };
  }
  async assessQuality() {
    const sources = this.state.sources.size;
    const analyzed = this.state.analyzedContent.size;
    const effort = this.config.effort;
    const completeness = Math.min(1, sources / effort.maxSources);
    const depth = Math.min(1, analyzed / Math.max(sources, 1));
    const diversity = this.calculateDiversity();
    const overall = completeness * 0.3 + depth * 0.4 + diversity * 0.3;
    const isSOTA = overall >= effort.qualityThreshold;
    return {
      overall,
      completeness,
      accuracy: 0.8,
      // Placeholder
      depth,
      diversity,
      coherence: 0.8,
      // Placeholder
      isSOTA
    };
  }
  calculateDiversity() {
    const domains = new Set(
      Array.from(this.state.sources.values()).map((s) => s.domain)
    );
    const types = new Set(
      Array.from(this.state.sources.values()).map((s) => s.sourceType)
    );
    return Math.min(1, (domains.size / 10 + types.size / 5) / 2);
  }
  shouldStop() {
    return this.config.abortSignal?.aborted ?? false;
  }
  initState() {
    return {
      researchId: uuid2(),
      query: null,
      sources: /* @__PURE__ */ new Map(),
      rankedSources: [],
      scrapedContent: /* @__PURE__ */ new Map(),
      analyzedContent: /* @__PURE__ */ new Map(),
      stepsCompleted: 0,
      totalSteps: 0,
      startTime: Date.now(),
      quality: null
    };
  }
  calculateTotalSteps(query) {
    const searchSteps = Math.ceil(
      query.subQueries.length / this.config.effort.parallelism
    );
    const extractSteps = Math.ceil(this.config.effort.maxSources / 5);
    const analyzeSteps = Math.ceil(this.config.effort.maxSources / 5);
    return searchSteps + 1 + extractSteps + analyzeSteps + 3;
  }
  batchQueries(items, batchSize) {
    return this.batchArray(items, batchSize);
  }
  batchArray(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  phaseStarted(phase, message) {
    return {
      type: "phase-started",
      timestamp: /* @__PURE__ */ new Date(),
      researchId: this.state.researchId,
      phase,
      message
    };
  }
  phaseCompleted(phase) {
    return {
      type: "phase-completed",
      timestamp: /* @__PURE__ */ new Date(),
      researchId: this.state.researchId,
      phase,
      durationMs: Date.now() - this.state.startTime
    };
  }
  progressUpdate(message) {
    const progress = this.state.stepsCompleted / Math.max(this.state.totalSteps, 1);
    return {
      type: "progress-update",
      timestamp: /* @__PURE__ */ new Date(),
      researchId: this.state.researchId,
      progress,
      message,
      stats: {
        sourcesFound: this.state.sources.size,
        sourcesProcessed: this.state.scrapedContent.size,
        stepsCompleted: this.state.stepsCompleted,
        totalSteps: this.state.totalSteps
      }
    };
  }
  qualityCheck(quality) {
    return {
      type: "quality-check",
      timestamp: /* @__PURE__ */ new Date(),
      researchId: this.state.researchId,
      score: quality.overall,
      isSOTA: quality.isSOTA,
      shouldStop: quality.isSOTA && this.config.effort.autoStopOnQuality,
      reason: quality.isSOTA ? "SOTA quality threshold reached" : void 0
    };
  }
  buildResult(status, error) {
    return {
      id: this.state.researchId,
      query: this.state.query,
      status,
      progress: status === "completed" ? 1 : this.state.stepsCompleted / Math.max(this.state.totalSteps, 1),
      currentPhase: status,
      sources: Array.from(this.state.sources.values()),
      quality: this.state.quality ?? void 0,
      charts: [],
      timeline: [],
      stats: {
        totalSources: this.state.sources.size,
        sourcesProcessed: this.state.scrapedContent.size,
        stepsCompleted: this.state.stepsCompleted,
        totalSteps: this.state.totalSteps,
        searchQueries: this.state.query?.subQueries.length ?? 0,
        pagesExtracted: this.state.scrapedContent.size,
        durationMs: Date.now() - this.state.startTime
      },
      startedAt: new Date(this.state.startTime),
      error
    };
  }
};

// src/use-cases/deep-research.use-case.ts
var DeepResearchUseCase = class {
  constructor(ports) {
    this.ports = ports;
  }
  /**
   * Execute deep research on a query
   * Yields progress events and returns final result
   */
  async *research(query, options) {
    const effortConfig = this.buildEffortConfig(options);
    const orchestrator = new ResearchOrchestrator(this.ports, {
      effort: effortConfig,
      abortSignal: options.abortSignal
    });
    return yield* orchestrator.execute(query, options.context);
  }
  /**
   * Quick research - returns result without streaming events
   */
  async researchQuick(query, options) {
    const generator = this.research(query, { ...options, effort: "standard" });
    let result;
    for await (const event of generator) {
      if (event.type === "completed") {
        const next = await generator.next();
        if (next.done && next.value) {
          result = next.value;
        }
        break;
      }
    }
    if (!result) {
      const next = await generator.next();
      if (next.done && next.value) {
        result = next.value;
      }
    }
    if (!result) {
      throw new Error("Research did not produce a result");
    }
    return result;
  }
  buildEffortConfig(options) {
    const preset = EFFORT_PRESETS[options.effort];
    return {
      ...preset,
      ...options.customConfig
    };
  }
};

// src/tools.ts
var DeepResearchInputSchema = z3.object({
  query: z3.string().describe("The research query to investigate"),
  effort: EffortLevelSchema.default("standard").describe(
    "Research effort level: standard (~3min), deep (~10min), max (~30min)"
  ),
  context: z3.string().optional().describe("Additional context for the research")
});
function createDeepResearchTools(ports) {
  const useCase = new DeepResearchUseCase(ports);
  return [
    {
      name: "deep-research",
      description: `Conduct comprehensive deep research on a topic. 
Uses parallel search, source ranking, content extraction, and AI synthesis.
Returns a structured report with citations, key findings, and visualizations.

Effort levels:
- standard: ~3 min, 10-25 sources, comprehensive analysis
- deep: ~10 min, 25-50 sources, advanced analysis with fact verification  
- max: ~30 min, 50-100+ sources, state-of-the-art exhaustive research`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The research query to investigate"
          },
          effort: {
            type: "string",
            enum: ["standard", "deep", "max"],
            default: "standard",
            description: "Research effort level"
          },
          context: {
            type: "string",
            description: "Additional context for the research"
          }
        },
        required: ["query"]
      },
      execute: async (input, options) => {
        const events = [];
        try {
          const generator = useCase.research(input.query, {
            effort: input.effort,
            context: input.context,
            abortSignal: options?.signal
          });
          let finalResult;
          for await (const event of generator) {
            if (event.type === "progress-update") {
              options?.onProgress?.({
                progress: event.progress,
                message: event.message
              });
              events.push(
                `[${Math.round(event.progress * 100)}%] ${event.message}`
              );
            } else if (event.type === "phase-started") {
              options?.onProgress?.({ message: event.message });
              events.push(`> ${event.message}`);
            } else if (event.type === "finding-discovered") {
              events.push(`Finding: ${event.finding}`);
            } else if (event.type === "quality-check") {
              events.push(
                `Quality: ${Math.round(event.score * 100)}% ${event.isSOTA ? "(SOTA)" : ""}`
              );
            }
          }
          const result = await generator.next();
          if (result.done && result.value) {
            finalResult = result.value;
          }
          return {
            success: true,
            data: {
              status: finalResult?.status,
              stats: finalResult?.stats,
              synthesis: finalResult?.synthesis,
              sources: finalResult?.sources?.slice(0, 20),
              quality: finalResult?.quality,
              events: events.slice(-20)
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Research failed"
          };
        }
      }
    }
  ];
}

export {
  EffortLevelSchema,
  EffortConfigSchema,
  EFFORT_PRESETS,
  QueryDecomposer,
  ResearchOrchestrator,
  DeepResearchUseCase,
  DeepResearchInputSchema,
  createDeepResearchTools
};
