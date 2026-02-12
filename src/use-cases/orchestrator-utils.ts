/**
 * Orchestrator Utilities - helper functions for the research orchestrator
 */
import { v4 as uuid } from "uuid";
import type { Source } from "../domain/source.schema.js";
import type { ScrapedContent } from "../ports/content-scraper.port.js";
import type { AnalyzedContent } from "../ports/content-analyzer.port.js";
import type {
  ResearchResult,
  ResearchStatus,
  QualityScore,
} from "../domain/research-result.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { ResearchQuery } from "../domain/research-query.schema.js";
import type { EffortConfig } from "../domain/effort-level.schema.js";

export interface OrchestratorState {
  researchId: string;
  query: ResearchQuery | null;
  sources: Map<string, Source>;
  rankedSources: import("../domain/source.schema.js").RankedSource[];
  scrapedContent: Map<string, ScrapedContent>;
  analyzedContent: Map<string, AnalyzedContent>;
  stepsCompleted: number;
  totalSteps: number;
  startTime: number;
  quality: QualityScore | null;
}

export function initState(): OrchestratorState {
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

export function calculateTotalSteps(
  query: ResearchQuery,
  effort: EffortConfig,
): number {
  const searchSteps = Math.ceil(
    query.subQueries.length / effort.parallelism,
  );
  const extractSteps = Math.ceil(effort.maxSources / 5);
  const analyzeSteps = Math.ceil(effort.maxSources / 5);
  return searchSteps + 1 + extractSteps + analyzeSteps + 3;
}

export function batchArray<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

export function assessQuality(
  state: OrchestratorState,
  effort: EffortConfig,
): QualityScore {
  const sources = state.sources.size;
  const analyzed = state.analyzedContent.size;

  const completeness = Math.min(1, sources / effort.maxSources);
  const depth = Math.min(1, analyzed / Math.max(sources, 1));
  const diversity = calculateDiversity(state);

  const overall = completeness * 0.3 + depth * 0.4 + diversity * 0.3;
  const isSOTA = overall >= effort.qualityThreshold;

  return {
    overall,
    completeness,
    accuracy: 0.8,
    depth,
    diversity,
    coherence: 0.8,
    isSOTA,
  };
}

export function calculateDiversity(state: OrchestratorState): number {
  const domains = new Set(
    Array.from(state.sources.values()).map((s) => s.domain),
  );
  const types = new Set(
    Array.from(state.sources.values()).map((s) => s.sourceType),
  );

  return Math.min(1, (domains.size / 10 + types.size / 5) / 2);
}

export function phaseStarted(
  researchId: string,
  phase: ResearchStatus,
  message: string,
): ResearchEvent {
  return {
    type: "phase-started",
    timestamp: new Date(),
    researchId,
    phase,
    message,
  };
}

export function phaseCompleted(
  researchId: string,
  startTime: number,
  phase: ResearchStatus,
): ResearchEvent {
  return {
    type: "phase-completed",
    timestamp: new Date(),
    researchId,
    phase,
    durationMs: Date.now() - startTime,
  };
}

export function progressUpdate(
  state: OrchestratorState,
  message: string,
): ResearchEvent {
  const progress =
    state.stepsCompleted / Math.max(state.totalSteps, 1);
  return {
    type: "progress-update",
    timestamp: new Date(),
    researchId: state.researchId,
    progress,
    message,
    stats: {
      sourcesFound: state.sources.size,
      sourcesProcessed: state.scrapedContent.size,
      stepsCompleted: state.stepsCompleted,
      totalSteps: state.totalSteps,
    },
  };
}

export function qualityCheck(
  researchId: string,
  quality: QualityScore,
  autoStopOnQuality: boolean,
): ResearchEvent {
  return {
    type: "quality-check",
    timestamp: new Date(),
    researchId,
    score: quality.overall,
    isSOTA: quality.isSOTA,
    shouldStop: quality.isSOTA && autoStopOnQuality,
    reason: quality.isSOTA ? "SOTA quality threshold reached" : undefined,
  };
}

export function buildResult(
  state: OrchestratorState,
  status: ResearchStatus,
  error?: string,
): ResearchResult {
  return {
    id: state.researchId,
    query: state.query!,
    status,
    progress:
      status === "completed"
        ? 1
        : state.stepsCompleted / Math.max(state.totalSteps, 1),
    currentPhase: status,
    sources: Array.from(state.sources.values()),
    quality: state.quality ?? undefined,
    charts: [],
    timeline: [],
    stats: {
      totalSources: state.sources.size,
      sourcesProcessed: state.scrapedContent.size,
      stepsCompleted: state.stepsCompleted,
      totalSteps: state.totalSteps,
      searchQueries: state.query?.subQueries.length ?? 0,
      pagesExtracted: state.scrapedContent.size,
      durationMs: Date.now() - state.startTime,
    },
    startedAt: new Date(state.startTime),
    error,
  };
}
