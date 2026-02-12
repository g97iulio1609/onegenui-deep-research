/**
 * Research tool definitions for the deep research agent
 */
import { tool } from "ai";
import { z } from "zod";
import type { EffortConfig } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { WebSearchUseCase } from "@onegenui/web-search";
import type { ResearchState } from "./research-state.js";
import { addSearchResults, backgroundScrape } from "./research-state.js";

export function createResearchTools(
  state: ResearchState,
  effortConfig: EffortConfig,
  webSearch: WebSearchUseCase,
  onProgress: ((event: ResearchEvent) => void) | undefined,
) {
  return {
    webSearch: tool({
      description: "Search the web for information on a specific query. Returns URLs and snippets.",
      inputSchema: z.object({
        query: z.string().describe("The search query"),
        searchType: z.enum(["web", "news"]).default("web"),
      }),
      execute: async ({ query, searchType }) => {
        console.log(`[DeepResearch] webSearch tool called - query: "${query.slice(0, 50)}...", type: ${searchType}`);
        if (state.sources.size >= effortConfig.maxSources) {
          console.log(`[DeepResearch] Source limit reached (${state.sources.size}/${effortConfig.maxSources}), skipping search`);
          return { found: 0, scraped: state.scrapedContent.size, sources: [] };
        }
        onProgress?.({
          type: "phase-started", timestamp: new Date(), researchId: "agent",
          phase: "searching", message: `Searching: ${query}`,
        });

        try {
          const remainingSlots = Math.max(0, effortConfig.maxSources - state.sources.size);
          const response = await webSearch.search(query, {
            maxResults: Math.max(1, Math.min(remainingSlots, Math.min(10, Math.ceil(effortConfig.maxSources / 3)))),
            searchType, timeout: 45000, cache: true,
          });

          const results = response.results.results || [];
          const newUrls = addSearchResults(state, results, effortConfig.maxSources);
          console.log(`[DeepResearch] Added ${newUrls.length} sources, total: ${state.sources.size}`);

          backgroundScrape(state, newUrls, webSearch);

          return {
            found: results.length,
            scraped: state.scrapedContent.size,
            sources: results.slice(0, 8).map((r: { title?: string; url?: string; snippet?: string }) => ({
              title: r.title, url: r.url, snippet: r.snippet,
            })),
          };
        } catch (error) {
          return { found: 0, scraped: 0, sources: [], error: error instanceof Error ? error.message : "Search failed" };
        }
      },
    }),

    scrapeContent: tool({
      description: "Extract content from a URL. Use after finding relevant sources.",
      inputSchema: z.object({ url: z.string().url().describe("The URL to scrape") }),
      execute: async ({ url }) => {
        onProgress?.({
          type: "progress-update", timestamp: new Date(), researchId: "agent",
          progress: state.scrapedContent.size / effortConfig.maxSources,
          message: `Extracting: ${new URL(url).hostname}`,
          stats: { sourcesFound: state.sources.size, sourcesProcessed: state.scrapedContent.size, stepsCompleted: 0, totalSteps: 0 },
        });
        try {
          const response = await webSearch.scrape(url, { timeout: 20000, maxContentLength: 25000, cache: true });
          const content = response.result.content;
          if (content) {
            state.scrapedContent.set(url, content);
            return { success: true, title: response.result.title, wordCount: content.split(/\s+/).length, content: content.slice(0, 8000), excerpt: content.slice(0, 500) };
          }
          return { success: false, error: "No content extracted" };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Scrape failed" };
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
        onProgress?.({ type: "finding-discovered", timestamp: new Date(), researchId: "agent", finding, confidence: "medium", sourceIds: source ? [source] : [] });
        return { recorded: true, totalFindings: state.findings.length };
      },
    }),

    getResearchStatus: tool({
      description: "Get the current status of the research. Use to check progress.",
      inputSchema: z.object({}),
      execute: async () => ({
        sourcesFound: state.sources.size, sourcesScraped: state.scrapedContent.size,
        findingsRecorded: state.findings.length, targetSources: effortConfig.maxSources,
        elapsedMs: Date.now() - state.startTime,
      }),
    }),
  };
}
