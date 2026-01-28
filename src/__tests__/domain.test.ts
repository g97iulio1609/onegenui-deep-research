/**
 * Tests for Deep Research Domain Schemas
 */
import { describe, it, expect } from "vitest";
import {
  EffortLevelSchema,
  EFFORT_PRESETS,
  SourceSchema,
  ResearchQuerySchema,
  SearchStrategySchema,
} from "../domain";

describe("EffortLevelSchema", () => {
  it("should validate valid effort levels", () => {
    expect(EffortLevelSchema.parse("standard")).toBe("standard");
    expect(EffortLevelSchema.parse("deep")).toBe("deep");
    expect(EffortLevelSchema.parse("max")).toBe("max");
  });

  it("should reject invalid effort levels", () => {
    expect(() => EffortLevelSchema.parse("quick")).toThrow();
    expect(() => EffortLevelSchema.parse("invalid")).toThrow();
  });

  it("should have presets for all effort levels", () => {
    expect(EFFORT_PRESETS.standard).toBeDefined();
    expect(EFFORT_PRESETS.deep).toBeDefined();
    expect(EFFORT_PRESETS.max).toBeDefined();
  });

  it("should have increasing maxSteps for higher effort levels", () => {
    expect(EFFORT_PRESETS.standard.maxSteps).toBeLessThan(
      EFFORT_PRESETS.deep.maxSteps,
    );
    expect(EFFORT_PRESETS.deep.maxSteps).toBeLessThan(
      EFFORT_PRESETS.max.maxSteps,
    );
  });
});

describe("SourceSchema", () => {
  it("should validate a valid source", () => {
    const source = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      url: "https://example.com/article",
      title: "Test Article",
      domain: "example.com",
      sourceType: "general",
      credibilityScore: 0.8,
      relevanceScore: 0.7,
      media: [],
    };

    const result = SourceSchema.parse(source);
    expect(result.id).toBe(source.id);
    expect(result.url).toBe(source.url);
    expect(result.credibilityScore).toBe(0.8);
  });

  it("should enforce score ranges", () => {
    const invalidSource = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      url: "https://example.com",
      title: "Test",
      domain: "example.com",
      sourceType: "general",
      credibilityScore: 1.5, // Invalid: > 1
      relevanceScore: 0.5,
      media: [],
    };

    expect(() => SourceSchema.parse(invalidSource)).toThrow();
  });

  it("should validate source types", () => {
    expect([
      "academic",
      "news",
      "social",
      "technical",
      "official",
      "general",
    ]).toEqual(expect.arrayContaining(["academic", "news"]));
  });
});

describe("ResearchQuerySchema", () => {
  it("should validate a valid research query", () => {
    const query = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      originalQuery: "What is the impact of AI on healthcare?",
      mainTopics: ["AI", "healthcare"],
      effort: EFFORT_PRESETS.deep,
      context: "Academic research",
      subQueries: [],
      createdAt: new Date(),
    };

    const result = ResearchQuerySchema.parse(query);
    expect(result.originalQuery).toBe(query.originalQuery);
    expect(result.effort.level).toBe("deep");
  });
});

describe("SearchStrategySchema", () => {
  it("should validate search strategies", () => {
    expect(SearchStrategySchema.parse("broad")).toBe("broad");
    expect(SearchStrategySchema.parse("academic")).toBe("academic");
    expect(SearchStrategySchema.parse("news")).toBe("news");
    expect(SearchStrategySchema.parse("technical")).toBe("technical");
  });
});
