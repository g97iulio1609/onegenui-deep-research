/**
 * Phase Executors - search, ranking, and extraction phases
 */
import type { OrchestratorPorts } from "./orchestrator.js";
import type { OrchestratorState } from "./orchestrator-utils.js";
import { batchArray, progressUpdate } from "./orchestrator-utils.js";
import type { Source, RankedSource } from "../domain/source.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { EffortConfig } from "../domain/effort-level.schema.js";
import type pLimit from "p-limit";

export async function* executeSearchPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
  effort: EffortConfig,
  parallelLimit: ReturnType<typeof pLimit>,
): AsyncGenerator<ResearchEvent> {
  const { researchId } = state;
  const query = state.query!;
  const searchOptions = {
    maxResults: Math.ceil(effort.maxSources / query.subQueries.length),
    timeout: 30000,
    strategy: "broad" as const,
  };

  let parallelGroup = 0;
  const batches = batchArray(query.subQueries, effort.parallelism);

  for (const batch of batches) {
    parallelGroup++;
    const tasks = batch.map((subQuery) =>
      parallelLimit(async () => {
        const result = await ports.search.search(subQuery.query, {
          ...searchOptions,
          strategy: subQuery.strategy,
        });

        for (const source of result.sources) {
          if (state.sources.size >= effort.maxSources * 2) {
            break;
          }
          if (!state.sources.has(source.url)) {
            state.sources.set(source.url, source as Source);
          }
        }

        return result;
      }),
    );

    yield {
      type: "step-started",
      timestamp: new Date(),
      researchId,
      stepId: `search-batch-${parallelGroup}`,
      stepType: "search",
      description: `Searching ${batch.length} queries`,
      parallelGroup,
    };

    await Promise.all(tasks);
    state.stepsCompleted += batch.length;

    yield {
      type: "step-completed",
      timestamp: new Date(),
      researchId,
      stepId: `search-batch-${parallelGroup}`,
      success: true,
      durationMs: 0,
      resultSummary: `Found ${state.sources.size} unique sources`,
    };

    yield progressUpdate(state, `Completed search batch ${parallelGroup}`);
  }
}

export async function executeRankingPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
  effort: EffortConfig,
): Promise<void> {
  const query = state.query!;
  const sources = Array.from(state.sources.values());

  state.rankedSources = await ports.ranker.rank(sources, {
    query: query.originalQuery,
    topics: query.mainTopics,
    preferRecent: query.temporalFocus === "recent",
  });

  state.rankedSources = state.rankedSources.slice(0, effort.maxSources);

  state.rankedSources = ports.ranker.diversify(
    state.rankedSources,
    3,
  ) as RankedSource[];

  state.stepsCompleted++;
}

export async function* executeExtractionPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
): AsyncGenerator<ResearchEvent> {
  const { researchId } = state;
  const scrapeOptions = {
    timeout: 15000,
    extractMedia: true,
    maxContentLength: 50000,
  };

  const urls = state.rankedSources
    .filter((s) => ports.scraper.canScrapeWithoutBrowser(s.url))
    .map((s) => s.url);

  let scraped = 0;
  for await (const content of ports.scraper.scrapeMany(urls, scrapeOptions)) {
    if (content.success) {
      state.scrapedContent.set(content.url, content);

      yield {
        type: "source-extracted",
        timestamp: new Date(),
        researchId,
        sourceId: state.sources.get(content.url)?.id ?? "",
        wordCount: content.wordCount,
        mediaCount: content.media.length,
      };
    }

    scraped++;
    if (scraped % 5 === 0) {
      yield progressUpdate(state, `Extracted ${scraped}/${urls.length} pages`);
    }
  }

  state.stepsCompleted += Math.ceil(urls.length / 5);
}
