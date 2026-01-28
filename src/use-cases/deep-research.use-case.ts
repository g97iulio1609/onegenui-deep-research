/**
 * Deep Research Use Case - main entry point
 */
import type { ResearchResult } from "../domain/research-result.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type {
  EffortLevel,
  EffortConfig,
} from "../domain/effort-level.schema.js";
import { EFFORT_PRESETS } from "../domain/effort-level.schema.js";
import {
  ResearchOrchestrator,
  type OrchestratorPorts,
} from "./orchestrator.js";

export interface DeepResearchOptions {
  effort: EffortLevel;
  customConfig?: Partial<EffortConfig>;
  context?: string;
  abortSignal?: AbortSignal;
}

export class DeepResearchUseCase {
  constructor(private ports: OrchestratorPorts) {}

  /**
   * Execute deep research on a query
   * Yields progress events and returns final result
   */
  async *research(
    query: string,
    options: DeepResearchOptions,
  ): AsyncGenerator<ResearchEvent, ResearchResult, unknown> {
    const effortConfig = this.buildEffortConfig(options);

    const orchestrator = new ResearchOrchestrator(this.ports, {
      effort: effortConfig,
      abortSignal: options.abortSignal,
    });

    return yield* orchestrator.execute(query, options.context);
  }

  /**
   * Quick research - returns result without streaming events
   */
  async researchQuick(
    query: string,
    options: Omit<DeepResearchOptions, "effort">,
  ): Promise<ResearchResult> {
    const generator = this.research(query, { ...options, effort: "standard" });

    let result: ResearchResult | undefined;
    for await (const event of generator) {
      // Consume events silently
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

  private buildEffortConfig(options: DeepResearchOptions): EffortConfig {
    const preset = EFFORT_PRESETS[options.effort];
    return {
      ...preset,
      ...options.customConfig,
    };
  }
}

export { ResearchOrchestrator } from "./orchestrator.js";
export { QueryDecomposer } from "./query-decomposer.js";
