/**
 * Deep Research Factory - creates configured deep research instance
 * KISS: single factory function for complete setup
 */
import type { LanguageModelV1 } from "ai";
import { DeepResearchUseCase } from "./use-cases/deep-research.use-case.js";
import { AiSdkLlmAdapter } from "./adapters/ai-sdk-llm.adapter.js";
import { DeepSearchAdapter } from "./adapters/deep-search.adapter.js";
import { LightweightScraperAdapter } from "./adapters/lightweight-scraper.adapter.js";
import { ContentAnalyzerAdapter } from "./adapters/content-analyzer.adapter.js";
import { SourceRankerAdapter } from "./adapters/source-ranker.adapter.js";
import { KnowledgeGraphAdapter } from "./adapters/knowledge-graph.adapter.js";
import { SynthesizerAdapter } from "./adapters/synthesizer.adapter.js";
import type { OrchestratorPorts } from "./use-cases/orchestrator.js";

export interface DeepResearchFactoryOptions {
  model: LanguageModelV1;
  embeddingModel?: Parameters<typeof import("ai").embed>[0]["model"];
}

/**
 * Create a fully configured DeepResearchUseCase instance
 * Reuses AI SDK model for all LLM operations
 */
export function createDeepResearch(
  options: DeepResearchFactoryOptions,
): DeepResearchUseCase {
  const llmAdapter = new AiSdkLlmAdapter({
    model: options.model,
    embeddingModel: options.embeddingModel,
  });

  const ports: OrchestratorPorts = {
    search: new DeepSearchAdapter({ maxConcurrency: 10 }),
    scraper: new LightweightScraperAdapter(),
    analyzer: new ContentAnalyzerAdapter(llmAdapter),
    ranker: new SourceRankerAdapter(),
    graph: new KnowledgeGraphAdapter(),
    synthesizer: new SynthesizerAdapter(llmAdapter),
    llm: llmAdapter,
  };

  return new DeepResearchUseCase(ports);
}

export {
  DeepResearchUseCase,
  type DeepResearchOptions,
} from "./use-cases/deep-research.use-case.js";
