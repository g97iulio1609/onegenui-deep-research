/**
 * Research Orchestrator - coordinates the entire deep research process
 * Implements DAG-based parallel execution with early stopping
 */
import pLimit from "p-limit";
import { loggers } from "@onegenui/utils";
import type { DeepSearchPort } from "../ports/deep-search.port.js";
import type { ContentScraperPort } from "../ports/content-scraper.port.js";
import type { ContentAnalyzerPort } from "../ports/content-analyzer.port.js";
import type { SourceRankerPort } from "../ports/source-ranker.port.js";
import type { KnowledgeGraphPort } from "../ports/knowledge-graph.port.js";
import type { SynthesizerPort } from "../ports/synthesizer.port.js";
import type { LLMPort } from "../ports/llm.port.js";
import type { ResearchResult } from "../domain/research-result.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { EffortConfig } from "../domain/effort-level.schema.js";
import { QueryDecomposer } from "./query-decomposer.js";
import {
  type OrchestratorState,
  initState,
  calculateTotalSteps,
  assessQuality,
  phaseStarted,
  phaseCompleted,
  qualityCheck,
  progressUpdate,
  buildResult,
} from "./orchestrator-utils.js";
import {
  executeSearchPhase,
  executeRankingPhase,
  executeExtractionPhase,
} from "./phase-executors.js";
import {
  executeAnalysisPhase,
  executeRecursiveSearch,
  executeSynthesisPhase,
  executeVisualizationPhase,
} from "./phase-analysis.js";

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

export class ResearchOrchestrator {
  private state: OrchestratorState;
  private decomposer: QueryDecomposer;
  private parallelLimit: ReturnType<typeof pLimit>;

  constructor(
    private ports: OrchestratorPorts,
    private config: OrchestratorConfig,
  ) {
    this.state = initState();
    this.decomposer = new QueryDecomposer(ports.llm);
    this.parallelLimit = pLimit(config.effort.parallelism);
  }

  async *execute(
    queryText: string,
    context?: string,
  ): AsyncGenerator<ResearchEvent, ResearchResult, unknown> {
    this.state = initState();
    const { researchId } = this.state;
    const effort = this.config.effort;

    log.debug("[DeepResearch] execute() started", { researchId, queryLength: queryText.length });

    try {
      // Phase 1: Query Decomposition
      log.debug("[DeepResearch] Phase 1: Decomposing query");
      yield phaseStarted(researchId, "decomposing", "Decomposing query into sub-queries");
      const query = await this.decomposer.decompose(queryText, effort, context);
      log.debug("[DeepResearch] Query decomposed", { subQueries: query.subQueries.length });
      this.state.query = query;
      this.state.totalSteps = calculateTotalSteps(query, effort);
      yield phaseCompleted(researchId, this.state.startTime, "decomposing");

      // Phase 2: Parallel Search
      yield phaseStarted(researchId, "searching", `Searching ${query.subQueries.length} queries in parallel`);
      yield* executeSearchPhase(this.state, this.ports, effort, this.parallelLimit);
      yield phaseCompleted(researchId, this.state.startTime, "searching");

      if (this.shouldStop()) return buildResult(this.state, "stopped");

      // Phase 3: Source Ranking
      yield phaseStarted(researchId, "ranking", "Ranking and selecting sources");
      await executeRankingPhase(this.state, this.ports, effort);
      yield phaseCompleted(researchId, this.state.startTime, "ranking");

      // Phase 4: Content Extraction
      yield phaseStarted(researchId, "extracting", `Extracting content from ${this.state.rankedSources.length} sources`);
      yield* executeExtractionPhase(this.state, this.ports);
      yield phaseCompleted(researchId, this.state.startTime, "extracting");

      // Phase 5: Content Analysis
      yield phaseStarted(researchId, "analyzing", "Analyzing content and extracting insights");
      yield* executeAnalysisPhase(this.state, this.ports, this.parallelLimit);
      yield phaseCompleted(researchId, this.state.startTime, "analyzing");

      // Quality check
      const quality = assessQuality(this.state, effort);
      this.state.quality = quality;
      yield qualityCheck(researchId, quality, effort.autoStopOnQuality);

      if (quality.isSOTA && effort.autoStopOnQuality) {
        yield phaseStarted(researchId, "synthesizing", "SOTA quality reached - generating report");
      } else {
        if (effort.recursionDepth > 1 && !quality.isSOTA) {
          yield* executeRecursiveSearch(this.state, this.ports);
        }
        yield phaseStarted(researchId, "synthesizing", "Generating comprehensive report");
      }

      // Phase 7: Synthesis
      const synthesis = yield* executeSynthesisPhase(this.state, this.ports);
      yield phaseCompleted(researchId, this.state.startTime, "synthesizing");

      // Phase 8: Visualization
      let knowledgeGraph, mindMap, charts, timeline;
      if (effort.enableVisualizations) {
        yield phaseStarted(researchId, "visualizing", "Generating visualizations");
        const visualizations = await executeVisualizationPhase(this.state, this.ports);
        knowledgeGraph = visualizations.graph;
        mindMap = visualizations.mindMap;
        charts = visualizations.charts;
        timeline = visualizations.timeline;
        yield phaseCompleted(researchId, this.state.startTime, "visualizing");
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

      return buildResult(
        this.state,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.state.sources.clear();
    this.state.scrapedContent.clear();
    this.state.analyzedContent.clear();
    this.state.rankedSources = [];
    log.debug("[DeepResearch] Cleanup completed");
  }

  private shouldStop(): boolean {
    return this.config.abortSignal?.aborted ?? false;
  }
}
