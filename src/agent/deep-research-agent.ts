/**
 * Deep Research Agent - ToolLoopAgent-based implementation
 * Uses AI SDK 6 ToolLoopAgent for agentic research workflow
 */
import { ToolLoopAgent, tool, stepCountIs } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import type { EffortLevel, EffortConfig } from "../domain/effort-level.schema.js";
import { EFFORT_PRESETS } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";

// Use web-search package for actual search/scrape
import { WebSearchUseCase, OneCrawlSearchAdapter, OneCrawlScraperAdapter } from "@onegenui/web-search";

export interface DeepResearchAgentOptions {
  model: LanguageModel;
  effort: EffortLevel;
  onProgress?: (event: ResearchEvent) => void;
  abortSignal?: AbortSignal;
  maxTokens?: number;
}

export interface DeepResearchAgentResult {
  synthesis: string;
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    snippet?: string;
  }>;
  stats: {
    totalSources: number;
    sourcesProcessed: number;
    durationMs: number;
  };
  quality: number;
}

// Default max tokens if not configured
const DEFAULT_MAX_TOKENS = 65000;

// Lazy singleton for WebSearchUseCase
let webSearchInstance: WebSearchUseCase | null = null;

function getWebSearchUseCase(): WebSearchUseCase {
  if (!webSearchInstance) {
    webSearchInstance = new WebSearchUseCase(
      [new OneCrawlSearchAdapter()],
      [new OneCrawlScraperAdapter()],
      { maxRetries: 2, initialDelay: 1000, backoffMultiplier: 2, maxDelay: 5000 }
    );
  }
  return webSearchInstance;
}

/**
 * Create a deep research agent using ToolLoopAgent
 */
export function createDeepResearchAgent(options: DeepResearchAgentOptions) {
  const { model, effort, onProgress, maxTokens = DEFAULT_MAX_TOKENS } = options;
  const effortConfig = EFFORT_PRESETS[effort];
  
  // Get web search service
  const webSearch = getWebSearchUseCase();
  
  // State to track research progress
  const state = {
    sources: new Map<string, { url: string; title: string; domain: string; snippet?: string }>(),
    scrapedContent: new Map<string, string>(),
    findings: [] as string[],
    startTime: Date.now(),
  };

  // Define research tools
  const researchTools = {
    webSearch: tool({
      description: "Search the web for information on a specific query. Returns URLs and snippets.",
      inputSchema: z.object({
        query: z.string().describe("The search query"),
        searchType: z.enum(["web", "news"]).default("web"),
      }),
      execute: async ({ query, searchType }) => {
        onProgress?.({
          type: "phase-started",
          timestamp: new Date(),
          researchId: "agent",
          phase: "searching",
          message: `Searching: ${query}`,
        });

        try {
          const response = await webSearch.search(query, {
            maxResults: Math.min(10, Math.ceil(effortConfig.maxSources / 3)),
            searchType,
            timeout: 45000,
            cache: true,
          });

          const results = response.results.results || [];
          
          // Store sources
          for (const result of results) {
            if (result.url && !state.sources.has(result.url)) {
              const urlObj = new URL(result.url);
              state.sources.set(result.url, {
                url: result.url,
                title: result.title || urlObj.hostname,
                domain: urlObj.hostname.replace("www.", ""),
                snippet: result.snippet,
              });
            }
          }

          return {
            found: results.length,
            sources: results.slice(0, 8).map(r => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };
        } catch (error) {
          return {
            found: 0,
            sources: [],
            error: error instanceof Error ? error.message : "Search failed",
          };
        }
      },
    }),

    scrapeContent: tool({
      description: "Extract content from a URL. Use after finding relevant sources.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL to scrape"),
      }),
      execute: async ({ url }) => {
        onProgress?.({
          type: "progress-update",
          timestamp: new Date(),
          researchId: "agent",
          progress: state.scrapedContent.size / effortConfig.maxSources,
          message: `Extracting: ${new URL(url).hostname}`,
          stats: {
            sourcesFound: state.sources.size,
            sourcesProcessed: state.scrapedContent.size,
            stepsCompleted: 0,
            totalSteps: 0,
          },
        });

        try {
          const response = await webSearch.scrape(url, {
            timeout: 20000,
            maxContentLength: 25000,
            cache: true,
          });

          const content = response.result.content;
          if (content) {
            state.scrapedContent.set(url, content);
            return {
              success: true,
              title: response.result.title,
              wordCount: content.split(/\s+/).length,
              excerpt: content.slice(0, 1000),
            };
          }

          return { success: false, error: "No content extracted" };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "Scrape failed" 
          };
        }
      },
    }),

    recordFinding: tool({
      description: "Record an important finding from the research. Use when you discover key information.",
      inputSchema: z.object({
        finding: z.string().describe("The key finding or insight"),
        source: z.string().optional().describe("The source URL this finding came from"),
      }),
      execute: async ({ finding, source }) => {
        state.findings.push(finding);
        onProgress?.({
          type: "finding-discovered",
          timestamp: new Date(),
          researchId: "agent",
          finding,
          confidence: "medium",
          sourceIds: source ? [source] : [],
        });
        return { recorded: true, totalFindings: state.findings.length };
      },
    }),

    getResearchStatus: tool({
      description: "Get the current status of the research. Use to check progress.",
      inputSchema: z.object({}),
      execute: async () => ({
        sourcesFound: state.sources.size,
        sourcesScraped: state.scrapedContent.size,
        findingsRecorded: state.findings.length,
        targetSources: effortConfig.maxSources,
        elapsedMs: Date.now() - state.startTime,
      }),
    }),
  };

  // Create the agent with high token limits for comprehensive synthesis
  const agent = new ToolLoopAgent({
    model,
    instructions: buildInstructions(effort, effortConfig),
    tools: researchTools,
    stopWhen: stepCountIs(effortConfig.maxSteps),
    maxOutputTokens: maxTokens,
    prepareStep: async ({ stepNumber }) => {
      // All phases: all tools available to let model decide
      // Early phase hints at search, but doesn't restrict
      if (stepNumber <= 3) {
        return {
          activeTools: ["webSearch", "getResearchStatus"],
          toolChoice: { type: "tool", toolName: "webSearch" }, // Force search initially
        };
      }
      // After initial searches, all tools available
      return {
        activeTools: ["webSearch", "scrapeContent", "recordFinding", "getResearchStatus"],
      };
    },
    onStepFinish: (step) => {
      // Track step count in state
      const stepCount = (state as any).stepCount ?? 0;
      (state as any).stepCount = stepCount + 1;
      
      onProgress?.({
        type: "progress-update",
        timestamp: new Date(),
        researchId: "agent",
        progress: Math.min(0.95, stepCount / effortConfig.maxSteps),
        message: `Step ${stepCount + 1} complete`,
        stats: {
          sourcesFound: state.sources.size,
          sourcesProcessed: state.scrapedContent.size,
          stepsCompleted: stepCount + 1,
          totalSteps: effortConfig.maxSteps,
        },
      });
    },
  });

  return {
    agent,
    state,
    
    async research(query: string, context?: string): Promise<DeepResearchAgentResult> {
      const prompt = context 
        ? `Research query: ${query}\n\nAdditional context: ${context}`
        : `Research query: ${query}`;

      onProgress?.({
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Starting research...",
      });

      const result = await agent.generate({ prompt });

      onProgress?.({
        type: "completed",
        timestamp: new Date(),
        researchId: "agent",
        totalDurationMs: Date.now() - state.startTime,
        finalQuality: state.findings.length > 0 ? 0.8 : 0.5,
      });

      return {
        synthesis: result.text,
        sources: Array.from(state.sources.values()),
        stats: {
          totalSources: state.sources.size,
          sourcesProcessed: state.scrapedContent.size,
          durationMs: Date.now() - state.startTime,
        },
        quality: Math.min(1, state.findings.length / 10),
      };
    },
  };
}

function buildInstructions(effort: EffortLevel, config: EffortConfig): string {
  return `You are a DEEP RESEARCH agent. Your mission is to conduct EXHAUSTIVE research on the given query.

## EFFORT LEVEL: ${effort.toUpperCase()}
- **MINIMUM sources to find**: ${config.maxSources}
- **MINIMUM sources to scrape**: ${Math.ceil(config.maxSources * 0.5)}
- **Target steps**: ${config.maxSteps}

## MANDATORY RESEARCH PHASES

### PHASE 1: BROAD SEARCH (steps 1-5)
You MUST perform at least 5 different web searches with varied queries:
- Original query in different phrasings
- Related academic/technical terms
- Different languages if relevant
- News and current events angle

### PHASE 2: DEEP EXTRACTION (steps 6-${Math.ceil(config.maxSteps * 0.7)})
You MUST scrape content from AT LEAST ${Math.ceil(config.maxSources * 0.5)} of the found sources.
- Use scrapeContent on EVERY promising URL
- Extract and analyze the actual content
- Do NOT skip this phase - web snippets are not enough

### PHASE 3: ANALYSIS (ongoing)
For EACH scraped source, use recordFinding to log:
- Key facts and statistics
- Expert opinions
- Contradictions between sources
- Unique insights

### PHASE 4: SYNTHESIS (final - CRITICAL)
After ALL research is complete, write a COMPREHENSIVE synthesis that:
- Is AT LEAST 2000-3000 words long
- Includes multiple sections with headers
- Cites sources inline using [source domain] format
- Covers ALL angles: historical, current state, different perspectives
- Includes comparisons, contrasts, and nuanced analysis
- Draws conclusions based on the evidence

## CRITICAL RULES
1. DO NOT finish early - use all available steps
2. DO NOT rely only on search snippets - SCRAPE the actual pages
3. DO NOT skip scrapeContent - it's essential for deep research
4. Check getResearchStatus regularly to track progress
5. If sourcesScraped < ${Math.ceil(config.maxSources * 0.3)}, keep scraping more URLs
6. Your final synthesis MUST be comprehensive and cite multiple sources

Your research quality depends on ACTUALLY READING the sources and writing a DETAILED synthesis.`;
}
