/**
 * Analysis Phase Executors - analysis, recursive search, synthesis, visualization
 */
import { v4 as uuid } from "uuid";
import type { OrchestratorPorts } from "./orchestrator.js";
import type { OrchestratorState } from "./orchestrator-utils.js";
import { batchArray, progressUpdate, phaseStarted, phaseCompleted } from "./orchestrator-utils.js";
import type { SubQuery } from "../domain/research-query.schema.js";
import type { Source } from "../domain/source.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type pLimit from "p-limit";

export async function* executeAnalysisPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
  parallelLimit: ReturnType<typeof pLimit>,
): AsyncGenerator<ResearchEvent> {
  const { researchId } = state;
  const query = state.query!;
  const contents = Array.from(state.scrapedContent.entries());

  const batches = batchArray(contents, 5);

  for (const batch of batches) {
    const tasks = batch.map(([url, content]) =>
      parallelLimit(async () => {
        const source = state.sources.get(url);
        if (!source) return null;

        const analyzed = await ports.analyzer.analyze(content.content, {
          query: query.originalQuery,
          topics: query.mainTopics,
          sourceId: source.id,
        });

        state.analyzedContent.set(source.id, analyzed);

        for (const keyPoint of analyzed.keyPoints.slice(0, 2)) {
          return {
            type: "finding-discovered" as const,
            timestamp: new Date(),
            researchId,
            finding: keyPoint,
            confidence: "medium" as const,
            sourceIds: [source.id],
          };
        }

        return null;
      }),
    );

    const results = await Promise.all(tasks);
    for (const event of results) {
      if (event) yield event;
    }

    state.stepsCompleted++;
    yield progressUpdate(
      state,
      `Analyzed ${state.analyzedContent.size} sources`,
    );
  }
}

export async function* executeRecursiveSearch(
  state: OrchestratorState,
  ports: OrchestratorPorts,
): AsyncGenerator<ResearchEvent> {
  const query = state.query!;
  const findings = Array.from(state.analyzedContent.values())
    .flatMap((a) => a.keyPoints)
    .slice(0, 5);

  if (findings.length === 0) return;

  const followUpQueries: SubQuery[] = findings.map((finding) => ({
    id: uuid(),
    query: `${query.originalQuery} ${finding}`,
    purpose: `Deep dive into: ${finding}`,
    strategy: "broad",
    priority: 5,
    depth: 1,
  }));

  yield phaseStarted(
    state.researchId,
    "searching",
    "Executing recursive search for deeper insights",
  );

  for await (const result of ports.search.searchParallel(
    followUpQueries,
    { maxResults: 5, timeout: 20000, strategy: "broad" },
  )) {
    for (const source of result.sources) {
      if (!state.sources.has(source.url)) {
        state.sources.set(source.url, source as Source);
      }
    }
  }

  yield phaseCompleted(state.researchId, state.startTime, "searching");
}

export async function* executeSynthesisPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
): AsyncGenerator<
  ResearchEvent,
  import("../domain/synthesis.schema.js").Synthesis
> {
  const query = state.query!;
  const contents = Array.from(state.analyzedContent.values());
  const sources = Array.from(state.sources.values());

  let synthesis:
    | import("../domain/synthesis.schema.js").Synthesis
    | undefined;

  for await (const event of ports.synthesizer.synthesize(
    contents,
    sources,
    query,
  )) {
    if (event.type === "complete") {
      synthesis =
        event.data as import("../domain/synthesis.schema.js").Synthesis;
    }
  }

  if (!synthesis) {
    throw new Error("Synthesis failed to complete");
  }

  return synthesis;
}

export async function executeVisualizationPhase(
  state: OrchestratorState,
  ports: OrchestratorPorts,
) {
  const query = state.query!;
  const contents = Array.from(state.analyzedContent.values());

  const graph = await ports.graph.build(contents);
  const mindMap = ports.graph.toMindMap(
    graph,
    query.mainTopics[0] || query.originalQuery,
  );

  return {
    graph,
    mindMap,
    charts: [],
    timeline: [],
  };
}
