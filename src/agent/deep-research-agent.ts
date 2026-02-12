/**
 * Deep Research Agent - ToolLoopAgent-based implementation
 * Uses AI SDK 6 ToolLoopAgent for agentic research workflow
 */
import { ToolLoopAgent, generateText, stepCountIs } from "ai";
import type { LanguageModel } from "ai";
import type { EffortLevel } from "../domain/effort-level.schema.js";
import { EFFORT_PRESETS } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";

import { WebSearchUseCase, OneCrawlSearchAdapter, OneCrawlScraperAdapter } from "@onegenui/web-search";

import { createInitialState, MAX_CONTENT_PER_SOURCE } from "./research-state.js";
import { createResearchTools } from "./research-tools.js";
import { buildInstructions } from "./prompts.js";
import { synthesizeReport } from "./synthesis.js";
import { createPrepareStep, createOnStepFinish } from "./agent-lifecycle.js";

export interface DeepResearchAgentOptions {
  model: LanguageModel;
  effort: EffortLevel;
  onProgress?: (event: ResearchEvent) => void;
  /** Callback to stream UI patches directly to frontend */
  onPatch?: (patch: string) => void;
  abortSignal?: AbortSignal;
  maxTokens?: number;
}

export interface DeepResearchAgentResult {
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
  /** Number of UI patches streamed during synthesis */
  patchesStreamed: number;
}

// Default max tokens if not configured
const DEFAULT_MAX_TOKENS = 65000;

// Lazy singleton for WebSearchUseCase
let webSearchInstance: WebSearchUseCase | null = null;

function getWebSearchUseCase(): WebSearchUseCase {
  if (!webSearchInstance) {
    webSearchInstance = new WebSearchUseCase(
      [new OneCrawlSearchAdapter()],
      [new OneCrawlScraperAdapter()],
      { maxRetries: 2, initialDelay: 1000, backoffMultiplier: 2, maxDelay: 5000 }
    );
  }
  return webSearchInstance;
}

/**
 * Create a deep research agent using ToolLoopAgent
 */
export function createDeepResearchAgent(options: DeepResearchAgentOptions) {
  const { model, effort, onProgress, onPatch, maxTokens = DEFAULT_MAX_TOKENS } = options;
  const effortConfig = EFFORT_PRESETS[effort];

  // Get web search service
  const webSearch = getWebSearchUseCase();

  // State to track research progress
  const state = createInitialState();

  // Function to summarize a batch of content in background
  const summarizeBatch = async (batchNum: number, contents: Array<{ url: string; content: string; title: string }>) => {
    if (contents.length === 0) return;

    console.log(`[DeepResearch] Starting batch ${batchNum} summarization (${contents.length} sources)...`);

    const contentText = contents.map((c, i) =>
      `### Source ${i + 1}: ${c.title}\nURL: ${c.url}\n${c.content.slice(0, MAX_CONTENT_PER_SOURCE)}\n`
    ).join('\n---\n');

    const summaryPrompt = `You are extracting key information from research sources.

## SOURCES TO ANALYZE
${contentText}

## YOUR TASK
For EACH source above, extract:
1. Main facts and data points
2. Key quotes or statements
3. Unique insights not likely found elsewhere
4. Any contradictions with common knowledge

Write a COMPREHENSIVE summary (500-800 words) that captures ALL important information from these sources. Be specific - include names, dates, numbers, and direct quotes where relevant.

Format as structured bullet points grouped by theme.`;

    try {
      const result = await generateText({
        model,
        prompt: summaryPrompt,
        maxOutputTokens: 4000,
      });

      if (result.text) {
        state.batchSummaries.push({
          batchNum,
          summary: result.text,
          sourceCount: contents.length,
        });
        console.log(`[DeepResearch] Batch ${batchNum} summarized: ${result.text.length} chars`);
      }
    } catch (error) {
      console.error(`[DeepResearch] Batch ${batchNum} summarization failed:`, error);
    }
  };

  // Define research tools
  const researchTools = createResearchTools(state, effortConfig, webSearch, onProgress);

  // Create the agent with high token limits for comprehensive synthesis
  const agent = new ToolLoopAgent({
    model,
    instructions: buildInstructions(effort, effortConfig),
    tools: researchTools,
    stopWhen: stepCountIs(effortConfig.maxSteps),
    maxOutputTokens: maxTokens,
    prepareStep: createPrepareStep(state, effort, effortConfig),
    onStepFinish: createOnStepFinish(state, effortConfig, summarizeBatch, onProgress),
  });

  return {
    agent,
    state,

    async research(query: string, context?: string): Promise<DeepResearchAgentResult> {
      const prompt = context
        ? `Research query: ${query}\n\nAdditional context: ${context}`
        : `Research query: ${query}`;

      console.log(`[DeepResearch] Starting research - query length: ${query.length}, effort: ${effort}`);

      onProgress?.({
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Starting research...",
      });

      console.log(`[DeepResearch] Calling agent.generate with prompt length: ${prompt.length}`);
      console.log(`[DeepResearch] Agent config - maxSteps: ${effortConfig.maxSteps}, maxTokens: ${maxTokens}`);
      console.log(`[DeepResearch] Tools available: ${Object.keys(researchTools).join(', ')}`);

      const startGenTime = Date.now();
      try {
        // Phase 1: Research Collection (using ToolLoopAgent)
        await agent.generate({ prompt });
        console.log(`[DeepResearch] Research collection completed in ${Date.now() - startGenTime}ms`);
        console.log(`[DeepResearch] Collected: ${state.sources.size} sources, ${state.scrapedContent.size} scraped, ${state.findings.length} findings`);
      } catch (genError) {
        console.error(`[DeepResearch] Research collection FAILED after ${Date.now() - startGenTime}ms:`, genError);
        throw genError;
      }

      // Phase 2: Explicit Synthesis with all collected data
      onProgress?.({
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "synthesizing",
        message: "Waiting for batch summaries and writing report...",
      });

      const { synthesis, patchesStreamed } = await synthesizeReport({
        state,
        query,
        context,
        effort,
        effortConfig,
        model,
        maxTokens,
        onPatch,
        onProgress,
        summarizeBatch,
      });

      onProgress?.({
        type: "completed",
        timestamp: new Date(),
        researchId: "agent",
        totalDurationMs: Date.now() - state.startTime,
        finalQuality: state.findings.length > 0 ? 0.8 : 0.5,
      });

      return {
        synthesis,
        sources: Array.from(state.sources.values()),
        stats: {
          totalSources: state.sources.size,
          sourcesProcessed: state.scrapedContent.size,
          durationMs: Date.now() - state.startTime,
        },
        quality: Math.min(1, state.findings.length / 10),
        patchesStreamed,
      };
    },
  };
}
