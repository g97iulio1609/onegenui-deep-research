/**
 * Deep Research Factory - creates configured deep research instance
 * KISS: single factory function for complete setup
 */
import type { LanguageModel } from "ai";
import type { ResearchEvent } from "./domain/events.schema.js";
import type { EffortLevel } from "./domain/effort-level.schema.js";
import { createDeepResearchAgent, type DeepResearchAgentResult } from "./agent/deep-research-agent.js";
import { createDeepAgentResearch } from "./agent/deep-agent-research.js";

export interface DeepResearchFactoryOptions {
  model: LanguageModel;
  maxTokens?: number;
}

export interface DeepResearchOptions {
  effort: EffortLevel;
  context?: string;
  abortSignal?: AbortSignal;
  onProgress?: (event: ResearchEvent) => void;
  onPatch?: (patch: string) => void;
}

export interface DeepResearchInstance {
  /**
   * Execute research and return result directly (recommended)
   */
  researchAsync(query: string, options: DeepResearchOptions): Promise<DeepResearchAgentResult>;
  
  /**
   * Execute research with streaming events (generator API)
   */
  research(query: string, options: DeepResearchOptions): AsyncGenerator<ResearchEvent, DeepResearchAgentResult, unknown>;
}

/**
 * Create a fully configured DeepResearch instance
 * Uses ToolLoopAgent for agentic research workflow
 */
export function createDeepResearch(
  factoryOptions: DeepResearchFactoryOptions,
): DeepResearchInstance {
  const { model, maxTokens } = factoryOptions;

  return {
    async researchAsync(query: string, options: DeepResearchOptions): Promise<DeepResearchAgentResult> {
      const agent = createDeepResearchAgent({
        model,
        effort: options.effort,
        abortSignal: options.abortSignal,
        onProgress: options.onProgress,
        onPatch: options.onPatch,
        maxTokens,
      });
      
      return agent.research(query, options.context);
    },

    async *research(query: string, options: DeepResearchOptions): AsyncGenerator<ResearchEvent, DeepResearchAgentResult, unknown> {
      const events: ResearchEvent[] = [];
      
      const agent = createDeepResearchAgent({
        model,
        effort: options.effort,
        abortSignal: options.abortSignal,
        maxTokens,
        onPatch: options.onPatch,
        onProgress: (event) => {
          events.push(event);
        },
      });

      // Start research in background and yield events
      const resultPromise = agent.research(query, options.context);
      
      // Yield initial event
      yield {
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Initializing research agent...",
      };

      // Wait for result while yielding collected events
      const result = await resultPromise;
      
      // Yield all collected events
      for (const event of events) {
        yield event;
      }

      // Yield completion
      yield {
        type: "completed",
        timestamp: new Date(),
        researchId: "agent",
        totalDurationMs: result.stats.durationMs,
        finalQuality: result.quality,
      };

      return result;
    },
  };
}

// Re-export types
export type { DeepResearchAgentResult } from "./agent/deep-research-agent.js";
export { EFFORT_PRESETS, type EffortLevel, type EffortConfig } from "./domain/effort-level.schema.js";

/**
 * Create a DeepAgent-based research instance (v2)
 * Simpler alternative using planning + subagents from @onegenui/deep-agents
 */
export function createDeepResearchV2(config: DeepResearchFactoryOptions) {
  return createDeepAgentResearch({
    model: config.model,
    maxSteps: 50,
  });
}
