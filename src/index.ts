/**
 * @onegenui/deep-research
 *
 * Deep Research engine with multi-level effort, parallel execution,
 * and rich content output. Implements hexagonal architecture.
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

// Factory (KISS: single function for complete setup)
export {
  createDeepResearch,
  type DeepResearchFactoryOptions,
} from "./factory.js";

// Tool definitions
export { createDeepResearchTools } from "./tools.js";
