// =============================================================================
// @onegenui/deep-research - React Native Compatible Entry Point
// =============================================================================
// Excludes CLI entry point (Node.js-only process.argv/process.exit).
// All adapters, agents, and use-cases are platform-agnostic.
// NOTE: Requires `react-native-get-random-values` polyfill before importing
// (uuid v4 relies on crypto.getRandomValues).

// Configuration (single source of truth)
export * from "./config.js";

// Domain schemas
export * from "./domain/index.js";

// Ports (interfaces)
export * from "./ports/index.js";

// Adapters (implementations — all platform-agnostic)
export * from "./adapters/index.js";

// Use cases
export * from "./use-cases/index.js";

// Agent (ToolLoopAgent-based)
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

// Tool definitions (same as Node — no Node-specific APIs)
export { createDeepResearchTools } from "./tools.js";
