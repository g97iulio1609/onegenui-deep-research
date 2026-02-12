/**
 * Agent lifecycle callbacks - prepareStep and onStepFinish
 */
import type { EffortLevel, EffortConfig } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { ResearchState } from "./research-state.js";
import { BATCH_SIZE } from "./research-state.js";
import { getEffortRequirements } from "./effort-config.js";

type SummarizeBatchFn = (batchNum: number, contents: Array<{ url: string; content: string; title: string }>) => Promise<void>;

type ToolName = "webSearch" | "scrapeContent" | "recordFinding" | "getResearchStatus";

export function createPrepareStep(
  state: ResearchState,
  effort: EffortLevel,
  effortConfig: EffortConfig,
) {
  return async ({ stepNumber }: { stepNumber: number }) => {
    const sourcesFound = state.sources.size;
    const sourcesScraped = state.scrapedContent.size;
    const scrapeRatio = sourcesFound > 0 ? sourcesScraped / sourcesFound : 0;

    const effortReqs = getEffortRequirements(effort, effortConfig);
    const minScrapesRequired = effortReqs.sourcesToScrape;
    const searchPhaseEnd = effortReqs.searchSteps;

    const forceScrapePhaseEnd = Math.floor(effortConfig.maxSteps * 0.6);
    const continueScrapingEnd = Math.floor(effortConfig.maxSteps * 0.8);

    console.log(`[DeepResearch] prepareStep - step: ${stepNumber}/${effortConfig.maxSteps}, effort: ${effort}, sources: ${sourcesFound}/${effortConfig.maxSources}, scraped: ${sourcesScraped}/${minScrapesRequired} required, ratio: ${(scrapeRatio * 100).toFixed(1)}%`);

    // STOP EARLY if we have enough sources
    if (sourcesFound >= effortConfig.maxSources && sourcesScraped >= minScrapesRequired) {
      console.log(`[DeepResearch] Sources limit reached (${sourcesFound}/${effortConfig.maxSources}), moving to synthesis phase`);
      return { activeTools: ["getResearchStatus"] as ToolName[], stopReason: "sources_limit_reached" };
    }

    // Phase 1: Force search to build source pool
    if (stepNumber <= searchPhaseEnd && sourcesFound < effortConfig.maxSources) {
      console.log(`[DeepResearch] Phase 1: Forcing search (step ${stepNumber}/${searchPhaseEnd})`);
      return { activeTools: ["webSearch", "getResearchStatus"] as ToolName[], toolChoice: { type: "tool" as const, toolName: "webSearch" as const } };
    }

    // Phase 2: Force scraping if ratio < 50%
    if (stepNumber <= forceScrapePhaseEnd && sourcesFound > 5 && scrapeRatio < 0.5) {
      console.log(`[DeepResearch] Phase 2: Forcing scrape (step ${stepNumber}/${forceScrapePhaseEnd}, ratio ${(scrapeRatio * 100).toFixed(1)}% < 50%)`);
      return { activeTools: ["scrapeContent", "recordFinding", "getResearchStatus"] as ToolName[], toolChoice: { type: "tool" as const, toolName: "scrapeContent" as const } };
    }

    // Phase 3: Continue scraping if minimums not met
    if (stepNumber <= continueScrapingEnd && sourcesScraped < minScrapesRequired && sourcesFound > sourcesScraped) {
      console.log(`[DeepResearch] Phase 3: Continue scraping (step ${stepNumber}/${continueScrapingEnd}, ${sourcesScraped}/${minScrapesRequired} required)`);
      return { activeTools: ["scrapeContent", "recordFinding", "webSearch", "getResearchStatus"] as ToolName[], toolChoice: { type: "tool" as const, toolName: "scrapeContent" as const } };
    }

    // Phase 4: Open phase - hint scraping if many unscraped
    if (sourcesFound > sourcesScraped * 2) {
      console.log(`[DeepResearch] Phase 4 (open): Hint scrape (many unscraped sources)`);
      return { activeTools: ["scrapeContent", "recordFinding", "webSearch", "getResearchStatus"] as ToolName[] };
    }

    console.log(`[DeepResearch] Phase 4 (open): All tools available`);
    return { activeTools: ["webSearch", "scrapeContent", "recordFinding", "getResearchStatus"] as ToolName[] };
  };
}

export function createOnStepFinish(
  state: ResearchState,
  effortConfig: EffortConfig,
  summarizeBatch: SummarizeBatchFn,
  onProgress?: (event: ResearchEvent) => void,
) {
  return (_step: unknown) => {
    state.stepCount++;

    console.log(`[DeepResearch] onStepFinish - step ${state.stepCount}, sources: ${state.sources.size}, scraped: ${state.scrapedContent.size}`);

    const allScrapedUrls = Array.from(state.scrapedContent.keys());
    const unsummarizedUrls = allScrapedUrls.filter(url => !state.summarizedUrls.has(url));

    if (unsummarizedUrls.length >= BATCH_SIZE) {
      const batchUrls = unsummarizedUrls.slice(0, BATCH_SIZE);
      const batchContents = batchUrls.map(url => ({
        url,
        content: state.scrapedContent.get(url) || '',
        title: state.sources.get(url)?.title || new URL(url).hostname,
      }));

      batchUrls.forEach(url => state.summarizedUrls.add(url));

      state.batchCounter++;
      const batchNum = state.batchCounter;

      console.log(`[DeepResearch] Triggering batch ${batchNum} summarization (${batchContents.length} sources) in background`);

      const summaryPromise = summarizeBatch(batchNum, batchContents);
      state.pendingSummaryPromises.push(summaryPromise);
    }

    onProgress?.({
      type: "progress-update",
      timestamp: new Date(),
      researchId: "agent",
      progress: Math.min(0.95, state.stepCount / effortConfig.maxSteps),
      message: `Step ${state.stepCount} complete (${state.batchSummaries.length} batches summarized)`,
      stats: {
        sourcesFound: state.sources.size,
        sourcesProcessed: state.scrapedContent.size,
        stepsCompleted: state.stepCount,
        totalSteps: effortConfig.maxSteps,
      },
    });
  };
}
