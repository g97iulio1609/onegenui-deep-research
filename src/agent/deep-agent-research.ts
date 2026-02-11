/**
 * DeepAgent-based research agent — alternative to deep-research-agent.ts
 * Uses @onegenui/deep-agents planning + subagents for simpler orchestration.
 */
import { DeepAgent } from "@onegenui/deep-agents";
import type { LanguageModel, Tool } from "ai";

export interface DeepAgentResearchConfig {
  model: LanguageModel;
  maxSteps?: number;
  tools?: Record<string, Tool>;
  onProgress?: (event: { type: string; data: unknown }) => void;
}

const RESEARCH_INSTRUCTIONS = `You are a deep research agent. Your task is to:
1. Break down research queries into specific sub-questions using write_todos
2. Search the web systematically for each sub-question
3. Read and analyze source content
4. Synthesize findings into a comprehensive report
5. Mark each todo as done when complete

Always start by planning your research with write_todos.
Use the available search and scraping tools to gather information.
Write your findings to files as you go.`;

export async function createDeepAgentResearch(
  config: DeepAgentResearchConfig,
): Promise<DeepAgent> {
  const { model, maxSteps = 50, tools = {}, onProgress } = config;

  const builder = DeepAgent.create({
    model,
    instructions: RESEARCH_INSTRUCTIONS,
    maxSteps,
  })
    .withPlanning()
    .withSubagents({ maxDepth: 2, timeoutMs: 120_000 });

  if (Object.keys(tools).length > 0) {
    builder.withTools(tools);
  }

  if (onProgress) {
    builder.on("step:start", (evt) =>
      onProgress({ type: "step:start", data: evt.data }),
    );
    builder.on("step:end", (evt) =>
      onProgress({ type: "step:end", data: evt.data }),
    );
  }

  return builder.build();
}
