/**
 * @onegenui/deep-research
 *
 * Deep Research engine with multi-level effort, parallel execution,
 * and rich content output. Uses ToolLoopAgent for agentic workflow.
 */

// Configuration (single source of truth)
export * from "./config.js";

// Domain schemas
export * from "./domain/index.js";

// Ports (interfaces)
export * from "./ports/index.js";

// Adapters (implementations)
export * from "./adapters/index.js";

// Use cases
export * from "./use-cases/index.js";

// Agent (new ToolLoopAgent-based implementation)
export {
  createDeepResearchAgent,
  type DeepResearchAgentOptions,
  type DeepResearchAgentResult,
} from "./agent/deep-research-agent.js";

// DeepAgent-based alternative (v2)
export {
  createDeepAgentResearch,
  type DeepAgentResearchConfig,
} from "./agent/deep-agent-research.js";

// Factory (KISS: single function for complete setup)
export {
  createDeepResearch,
  createDeepResearchV2,
  type DeepResearchFactoryOptions,
  type DeepResearchOptions,
  type DeepResearchInstance,
} from "./factory.js";

// Tool definitions
export { createDeepResearchTools } from "./tools.js";
