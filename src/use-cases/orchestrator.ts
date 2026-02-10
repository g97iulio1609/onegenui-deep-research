/**
 * Research Orchestrator - coordinates the entire deep research process
 * Implements DAG-based parallel execution with early stopping
 */
import { v4 as uuid } from "uuid";
import pLimit from "p-limit";
import { loggers } from "@onegenui/utils";
import type { DeepSearchPort } from "../ports/deep-search.port.js";
import type {
  ContentScraperPort,
  ScrapedContent,
} from "../ports/content-scraper.port.js";
import type {
  ContentAnalyzerPort,
  AnalyzedContent,
} from "../ports/content-analyzer.port.js";
import type { SourceRankerPort } from "../ports/source-ranker.port.js";
import type { KnowledgeGraphPort } from "../ports/knowledge-graph.port.js";
import type { SynthesizerPort } from "../ports/synthesizer.port.js";
import type { LLMPort } from "../ports/llm.port.js";
import type {
  ResearchQuery,
  SubQuery,
} from "../domain/research-query.schema.js";
import type { Source, RankedSource } from "../domain/source.schema.js";
import type {
  ResearchResult,
  ResearchStatus,
  QualityScore,
} from "../domain/research-result.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { EffortConfig } from "../domain/effort-level.schema.js";
import { QueryDecomposer } from "./query-decomposer.js";

const log = loggers.research;

export interface OrchestratorPorts {
  search: DeepSearchPort;
  scraper: ContentScraperPort;
  analyzer: ContentAnalyzerPort;
  ranker: SourceRankerPort;
  graph: KnowledgeGraphPort;
  synthesizer: SynthesizerPort;
  llm: LLMPort;
}

export interface OrchestratorConfig {
  effort: EffortConfig;
  abortSignal?: AbortSignal;
}

interface OrchestratorState {
  researchId: string;
  query: ResearchQuery | null;
  sources: Map<string, Source>;
  rankedSources: RankedSource[];
  scrapedContent: Map<string, ScrapedContent>;
  analyzedContent: Map<string, AnalyzedContent>;
  stepsCompleted: number;
  totalSteps: number;
  startTime: number;
  quality: QualityScore | null;
}

export class ResearchOrchestrator {
  private state: OrchestratorState;
  private decomposer: QueryDecomposer;
  private parallelLimit: ReturnType<typeof pLimit>;

  constructor(
    private ports: OrchestratorPorts,
    private config: OrchestratorConfig,
  ) {
    this.state = this.initState();
    this.decomposer = new QueryDecomposer(ports.llm);
    this.parallelLimit = pLimit(config.effort.parallelism);
  }

  async *execute(
    queryText: string,
    context?: string,
  ): AsyncGenerator<ResearchEvent, ResearchResult, unknown> {
    this.state = this.initState();
    const { researchId } = this.state;

    log.debug("[DeepResearch] execute() started", { researchId, queryLength: queryText.length });

    try {
      // Phase 1: Query Decomposition
      log.debug("[DeepResearch] Phase 1: Decomposing query");
      yield this.phaseStarted(
        "decomposing",
        "Decomposing query into sub-queries",
      );
      const query = await this.decomposer.decompose(
        queryText,
        this.config.effort,
        context,
      );
      log.debug("[DeepResearch] Query decomposed", { subQueries: query.subQueries.length });
      this.state.query = query;
      this.state.totalSteps = this.calculateTotalSteps(query);
      yield this.phaseCompleted("decomposing");

      // Phase 2: Parallel Search
      yield this.phaseStarted(
        "searching",
        `Searching ${query.subQueries.length} queries in parallel`,
      );
      yield* this.executeSearchPhase(query);
      yield this.phaseCompleted("searching");

      // Check early stop
      if (this.shouldStop()) {
        return this.buildResult("stopped");
      }

      // Phase 3: Source Ranking
      yield this.phaseStarted("ranking", "Ranking and selecting sources");
      await this.executeRankingPhase(query);
      yield this.phaseCompleted("ranking");

      // Phase 4: Content Extraction
      yield this.phaseStarted(
        "extracting",
        `Extracting content from ${this.state.rankedSources.length} sources`,
      );
      yield* this.executeExtractionPhase();
      yield this.phaseCompleted("extracting");


      // Phase 5: Content Analysis
      yield this.phaseStarted(
        "analyzing",
        "Analyzing content and extracting insights",
      );
      yield* this.executeAnalysisPhase(query);
      yield this.phaseCompleted("analyzing");

      // Quality check - early stop if SOTA reached
      const quality = await this.assessQuality();
      this.state.quality = quality;
      yield this.qualityCheck(quality);

      if (quality.isSOTA && this.config.effort.autoStopOnQuality) {
        yield this.phaseStarted(
          "synthesizing",
          "SOTA quality reached - generating report",
        );
      } else {
        // Phase 6: Additional depth if not SOTA
        if (this.config.effort.recursionDepth > 1 && !quality.isSOTA) {
          yield* this.executeRecursiveSearch(query);
        }
        yield this.phaseStarted(
          "synthesizing",
          "Generating comprehensive report",
        );
      }

      // Phase 7: Synthesis
      const synthesis = yield* this.executeSynthesisPhase(query);
      yield this.phaseCompleted("synthesizing");

      // Phase 8: Visualization (if enabled)
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
        timestamp: new Date(),
        researchId,
        totalDurationMs: Date.now() - this.state.startTime,
        finalQuality: this.state.quality?.overall ?? 0,
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
        quality: this.state.quality ?? undefined,
        stats: {
          totalSources: this.state.sources.size,
          sourcesProcessed: this.state.scrapedContent.size,
          stepsCompleted: this.state.stepsCompleted,
          totalSteps: this.state.totalSteps,
          searchQueries: query.subQueries.length,
          pagesExtracted: this.state.scrapedContent.size,
          durationMs: Date.now() - this.state.startTime,
        },
        startedAt: new Date(this.state.startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      log.error("[DeepResearch] Error in execute():", error);
      yield {
        type: "error",
        timestamp: new Date(),
        researchId,
        error: error instanceof Error ? error.message : "Unknown error",
        recoverable: false,
      };

      return this.buildResult(
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      // Cleanup to prevent memory leaks
      this.cleanup();
    }
  }

  /** Clear internal state to free memory after execution */
  private cleanup(): void {
    this.state.sources.clear();
    this.state.scrapedContent.clear();
    this.state.analyzedContent.clear();
    this.state.rankedSources = [];
    log.debug("[DeepResearch] Cleanup completed");
  }

  private async *executeSearchPhase(
    query: ResearchQuery,
  ): AsyncGenerator<ResearchEvent> {
    const { researchId } = this.state;
    const searchOptions = {
      maxResults: Math.ceil(
        this.config.effort.maxSources / query.subQueries.length,
      ),
      timeout: 30000,
      strategy: "broad" as const,
    };

    let parallelGroup = 0;
    const batches = this.batchQueries(
      query.subQueries,
      this.config.effort.parallelism,
    );

    for (const batch of batches) {
      parallelGroup++;
      const tasks = batch.map((subQuery) =>
        this.parallelLimit(async () => {
          const result = await this.ports.search.search(subQuery.query, {
            ...searchOptions,
            strategy: subQuery.strategy,
          });

          for (const source of result.sources) {
            // Limit sources to prevent unbounded memory growth
            if (this.state.sources.size >= this.config.effort.maxSources * 2) {
              break;
            }
            if (!this.state.sources.has(source.url)) {
              this.state.sources.set(source.url, source as Source);
            }
          }

          return result;
        }),
      );

      // Emit step started for batch
      yield {
        type: "step-started",
        timestamp: new Date(),
        researchId,
        stepId: `search-batch-${parallelGroup}`,
        stepType: "search",
        description: `Searching ${batch.length} queries`,
        parallelGroup,
      };

      await Promise.all(tasks);
      this.state.stepsCompleted += batch.length;

      yield {
        type: "step-completed",
        timestamp: new Date(),
        researchId,
        stepId: `search-batch-${parallelGroup}`,
        success: true,
        durationMs: 0,
        resultSummary: `Found ${this.state.sources.size} unique sources`,
      };

      yield this.progressUpdate(`Completed search batch ${parallelGroup}`);
    }
  }

  private async executeRankingPhase(query: ResearchQuery): Promise<void> {
    const sources = Array.from(this.state.sources.values());

    this.state.rankedSources = await this.ports.ranker.rank(sources, {
      query: query.originalQuery,
      topics: query.mainTopics,
      preferRecent: query.temporalFocus === "recent",
    });

    // Limit to maxSources
    this.state.rankedSources = this.state.rankedSources.slice(
      0,
      this.config.effort.maxSources,
    );

    // Diversify sources
    this.state.rankedSources = this.ports.ranker.diversify(
      this.state.rankedSources,
      3, // Max 3 per domain
    ) as RankedSource[];

    this.state.stepsCompleted++;
  }

  private async *executeExtractionPhase(): AsyncGenerator<ResearchEvent> {
    const { researchId } = this.state;
    const scrapeOptions = {
      timeout: 15000,
      extractMedia: true,
      maxContentLength: 50000,
    };

    const urls = this.state.rankedSources
      .filter((s) => this.ports.scraper.canScrapeWithoutBrowser(s.url))
      .map((s) => s.url);

    let scraped = 0;
    for await (const content of this.ports.scraper.scrapeMany(
      urls,
      scrapeOptions,
    )) {
      if (content.success) {
        this.state.scrapedContent.set(content.url, content);

        yield {
          type: "source-extracted",
          timestamp: new Date(),
          researchId,
          sourceId: this.state.sources.get(content.url)?.id ?? "",
          wordCount: content.wordCount,
          mediaCount: content.media.length,
        };
      }

      scraped++;
      if (scraped % 5 === 0) {
        yield this.progressUpdate(`Extracted ${scraped}/${urls.length} pages`);
      }
    }

    this.state.stepsCompleted += Math.ceil(urls.length / 5);
  }

  private async *executeAnalysisPhase(
    query: ResearchQuery,
  ): AsyncGenerator<ResearchEvent> {
    const { researchId } = this.state;
    const contents = Array.from(this.state.scrapedContent.entries());

    const batches = this.batchArray(contents, 5);

    for (const batch of batches) {
      const tasks = batch.map(([url, content]) =>
        this.parallelLimit(async () => {
          const source = this.state.sources.get(url);
          if (!source) return null;

          const analyzed = await this.ports.analyzer.analyze(content.content, {
            query: query.originalQuery,
            topics: query.mainTopics,
            sourceId: source.id,
          });

          this.state.analyzedContent.set(source.id, analyzed);

          // Emit findings
          for (const keyPoint of analyzed.keyPoints.slice(0, 2)) {
            return {
              type: "finding-discovered" as const,
              timestamp: new Date(),
              researchId,
              finding: keyPoint,
              confidence: "medium" as const,
              sourceIds: [source.id],
            };
          }

          return null;
        }),
      );

      const results = await Promise.all(tasks);
      for (const event of results) {
        if (event) yield event;
      }

      this.state.stepsCompleted++;
      yield this.progressUpdate(
        `Analyzed ${this.state.analyzedContent.size} sources`,
      );
    }
  }

  private async *executeRecursiveSearch(
    query: ResearchQuery,
  ): AsyncGenerator<ResearchEvent> {
    // Generate follow-up queries based on findings
    const findings = Array.from(this.state.analyzedContent.values())
      .flatMap((a) => a.keyPoints)
      .slice(0, 5);

    if (findings.length === 0) return;

    const followUpQueries: SubQuery[] = findings.map((finding, i) => ({
      id: uuid(),
      query: `${query.originalQuery} ${finding}`,
      purpose: `Deep dive into: ${finding}`,
      strategy: "broad",
      priority: 5,
      depth: 1,
    }));

    yield this.phaseStarted(
      "searching",
      "Executing recursive search for deeper insights",
    );

    for await (const result of this.ports.search.searchParallel(
      followUpQueries,
      { maxResults: 5, timeout: 20000, strategy: "broad" },
    )) {
      for (const source of result.sources) {
        if (!this.state.sources.has(source.url)) {
          this.state.sources.set(source.url, source as Source);
        }
      }
    }

    yield this.phaseCompleted("searching");
  }

  private async *executeSynthesisPhase(
    query: ResearchQuery,
  ): AsyncGenerator<
    ResearchEvent,
    import("../domain/synthesis.schema.js").Synthesis
  > {
    const contents = Array.from(this.state.analyzedContent.values());
    const sources = Array.from(this.state.sources.values());

    let synthesis:
      | import("../domain/synthesis.schema.js").Synthesis
      | undefined;

    for await (const event of this.ports.synthesizer.synthesize(
      contents,
      sources,
      query,
    )) {
      if (event.type === "complete") {
        synthesis =
          event.data as import("../domain/synthesis.schema.js").Synthesis;
      }
    }

    if (!synthesis) {
      throw new Error("Synthesis failed to complete");
    }

    return synthesis;
  }

  private async executeVisualizationPhase(query: ResearchQuery) {
    const contents = Array.from(this.state.analyzedContent.values());

    const graph = await this.ports.graph.build(contents);
    const mindMap = this.ports.graph.toMindMap(
      graph,
      query.mainTopics[0] || query.originalQuery,
    );

    return {
      graph,
      mindMap,
      charts: [], // TODO: Implement chart generation
      timeline: [], // TODO: Implement timeline extraction
    };
  }

  private async assessQuality(): Promise<QualityScore> {
    const sources = this.state.sources.size;
    const analyzed = this.state.analyzedContent.size;
    const effort = this.config.effort;

    // Simple heuristic quality scoring
    const completeness = Math.min(1, sources / effort.maxSources);
    const depth = Math.min(1, analyzed / Math.max(sources, 1));
    const diversity = this.calculateDiversity();

    const overall = completeness * 0.3 + depth * 0.4 + diversity * 0.3;
    const isSOTA = overall >= effort.qualityThreshold;

    return {
      overall,
      completeness,
      accuracy: 0.8, // Placeholder
      depth,
      diversity,
      coherence: 0.8, // Placeholder
      isSOTA,
    };
  }

  private calculateDiversity(): number {
    const domains = new Set(
      Array.from(this.state.sources.values()).map((s) => s.domain),
    );
    const types = new Set(
      Array.from(this.state.sources.values()).map((s) => s.sourceType),
    );

    return Math.min(1, (domains.size / 10 + types.size / 5) / 2);
  }

  private shouldStop(): boolean {
    return this.config.abortSignal?.aborted ?? false;
  }

  private initState(): OrchestratorState {
    return {
      researchId: uuid(),
      query: null,
      sources: new Map(),
      rankedSources: [],
      scrapedContent: new Map(),
      analyzedContent: new Map(),
      stepsCompleted: 0,
      totalSteps: 0,
      startTime: Date.now(),
      quality: null,
    };
  }

  private calculateTotalSteps(query: ResearchQuery): number {
    const searchSteps = Math.ceil(
      query.subQueries.length / this.config.effort.parallelism,
    );
    const extractSteps = Math.ceil(this.config.effort.maxSources / 5);
    const analyzeSteps = Math.ceil(this.config.effort.maxSources / 5);
    return searchSteps + 1 + extractSteps + analyzeSteps + 3; // +3 for ranking, synthesis, viz
  }

  private batchQueries<T>(items: T[], batchSize: number): T[][] {
    return this.batchArray(items, batchSize);
  }

  private batchArray<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private phaseStarted(phase: ResearchStatus, message: string): ResearchEvent {
    return {
      type: "phase-started",
      timestamp: new Date(),
      researchId: this.state.researchId,
      phase,
      message,
    };
  }

  private phaseCompleted(phase: ResearchStatus): ResearchEvent {
    return {
      type: "phase-completed",
      timestamp: new Date(),
      researchId: this.state.researchId,
      phase,
      durationMs: Date.now() - this.state.startTime,
    };
  }

  private progressUpdate(message: string): ResearchEvent {
    const progress =
      this.state.stepsCompleted / Math.max(this.state.totalSteps, 1);
    return {
      type: "progress-update",
      timestamp: new Date(),
      researchId: this.state.researchId,
      progress,
      message,
      stats: {
        sourcesFound: this.state.sources.size,
        sourcesProcessed: this.state.scrapedContent.size,
        stepsCompleted: this.state.stepsCompleted,
        totalSteps: this.state.totalSteps,
      },
    };
  }

  private qualityCheck(quality: QualityScore): ResearchEvent {
    return {
      type: "quality-check",
      timestamp: new Date(),
      researchId: this.state.researchId,
      score: quality.overall,
      isSOTA: quality.isSOTA,
      shouldStop: quality.isSOTA && this.config.effort.autoStopOnQuality,
      reason: quality.isSOTA ? "SOTA quality threshold reached" : undefined,
    };
  }

  private buildResult(status: ResearchStatus, error?: string): ResearchResult {
    return {
      id: this.state.researchId,
      query: this.state.query!,
      status,
      progress:
        status === "completed"
          ? 1
          : this.state.stepsCompleted / Math.max(this.state.totalSteps, 1),
      currentPhase: status,
      sources: Array.from(this.state.sources.values()),
      quality: this.state.quality ?? undefined,
      charts: [],
      timeline: [],
      stats: {
        totalSources: this.state.sources.size,
        sourcesProcessed: this.state.scrapedContent.size,
        stepsCompleted: this.state.stepsCompleted,
        totalSteps: this.state.totalSteps,
        searchQueries: this.state.query?.subQueries.length ?? 0,
        pagesExtracted: this.state.scrapedContent.size,
        durationMs: Date.now() - this.state.startTime,
      },
      startedAt: new Date(this.state.startTime),
      error,
    };
  }
}
