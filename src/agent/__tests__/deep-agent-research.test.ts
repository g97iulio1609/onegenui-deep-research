import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LanguageModel } from "ai";

// =============================================================================
// Mock AI SDK — same pattern as deep-agents tests
// =============================================================================

const { generateFn, constructorSpy } = vi.hoisted(() => {
  const generateFn = vi.fn().mockResolvedValue({
    text: "Mock response",
    steps: [{ type: "text" }],
  });
  const constructorSpy = vi.fn();
  return { generateFn, constructorSpy };
});

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  class MockToolLoopAgent {
    constructor(settings: Record<string, unknown>) {
      constructorSpy(settings);
    }
    generate = generateFn;
  }

  return { ...actual, ToolLoopAgent: MockToolLoopAgent };
});

import { createDeepAgentResearch } from "../deep-agent-research.js";

// =============================================================================
// Helpers
// =============================================================================

const mockModel = {
  modelId: "test-model",
  provider: "test-provider",
  specificationVersion: "v1",
  defaultObjectGenerationMode: "json",
} as unknown as LanguageModel;

// =============================================================================
// Tests
// =============================================================================

describe("createDeepAgentResearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateFn.mockResolvedValue({
      text: "Mock response",
      steps: [{ type: "text" }],
    });
  });

  it("should create a DeepAgent with research config", async () => {
    const agent = await createDeepAgentResearch({ model: mockModel });
    expect(agent).toBeDefined();
    expect(agent.sessionId).toBeDefined();
    expect(agent.eventBus).toBeDefined();
  });

  it("should accept custom maxSteps", async () => {
    const agent = await createDeepAgentResearch({
      model: mockModel,
      maxSteps: 100,
    });
    expect(agent).toBeDefined();
  });

  it("should wire onProgress to events", async () => {
    const onProgress = vi.fn();
    const agent = await createDeepAgentResearch({
      model: mockModel,
      onProgress,
    });
    expect(agent).toBeDefined();
    expect(agent.eventBus).toBeDefined();
  });

  it("should include planning tools when run", async () => {
    const agent = await createDeepAgentResearch({ model: mockModel });
    await agent.run("Research topic");

    expect(constructorSpy).toHaveBeenCalledTimes(1);
    const settings = constructorSpy.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    const toolKeys = Object.keys(
      settings.tools as Record<string, unknown>,
    );
    expect(toolKeys).toContain("write_todos");
    expect(toolKeys).toContain("review_todos");
  });

  it("should include subagent tools", async () => {
    const agent = await createDeepAgentResearch({ model: mockModel });
    await agent.run("Research topic");

    const settings = constructorSpy.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    const toolKeys = Object.keys(
      settings.tools as Record<string, unknown>,
    );
    expect(toolKeys).toContain("task");
  });

  it("should merge custom tools", async () => {
    const agent = await createDeepAgentResearch({
      model: mockModel,
      tools: {
        search: {} as any,
      },
    });
    await agent.run("Research topic");

    const settings = constructorSpy.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    const toolKeys = Object.keys(
      settings.tools as Record<string, unknown>,
    );
    expect(toolKeys).toContain("search");
  });
});
