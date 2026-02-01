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

// Use cases (legacy)
export * from "./use-cases/index.js";

// Agent (new ToolLoopAgent-based implementation)
export {
  createDeepResearchAgent,
  type DeepResearchAgentOptions,
  type DeepResearchAgentResult,
} from "./agent/deep-research-agent.js";

// Factory (KISS: single function for complete setup)
export {
  createDeepResearch,
  type DeepResearchFactoryOptions,
  type DeepResearchOptions,
  type DeepResearchInstance,
} from "./factory.js";

// Tool definitions
export { createDeepResearchTools } from "./tools.js";
