/**
 * MCP Tools for Deep Research
 */
import { z } from "zod";
import { DeepResearchUseCase } from "./use-cases/deep-research.use-case.js";
import { EffortLevelSchema } from "./domain/effort-level.schema.js";
import type { OrchestratorPorts } from "./use-cases/orchestrator.js";
import type { ResearchResult } from "./domain/research-result.schema.js";

const DeepResearchInputSchema = z.object({
  query: z.string().describe("The research query to investigate"),
  effort: EffortLevelSchema.default("standard").describe(
    "Research effort level: standard (~3min), deep (~10min), max (~30min)",
  ),
  context: z
    .string()
    .optional()
    .describe("Additional context for the research"),
});

export type DeepResearchInput = z.infer<typeof DeepResearchInputSchema>;

/**
 * Tool definition for deep research
 * Can be adapted to any MCP implementation
 */
export interface DeepResearchTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: {
      query: { type: "string"; description: string };
      effort: {
        type: "string";
        enum: string[];
        default: string;
        description: string;
      };
      context: { type: "string"; description: string };
    };
    required: string[];
  };
  execute: (
    input: DeepResearchInput,
    options?: {
      onProgress?: (p: { progress?: number; message?: string }) => void;
      signal?: AbortSignal;
    },
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

export function createDeepResearchTools(
  ports: OrchestratorPorts,
): DeepResearchTool[] {
  const useCase = new DeepResearchUseCase(ports);

  return [
    {
      name: "deep-research",
      description: `Conduct comprehensive deep research on a topic. 
Uses parallel search, source ranking, content extraction, and AI synthesis.
Returns a structured report with citations, key findings, and visualizations.

Effort levels:
- standard: ~3 min, 10-25 sources, comprehensive analysis
- deep: ~10 min, 25-50 sources, advanced analysis with fact verification  
- max: ~30 min, 50-100+ sources, state-of-the-art exhaustive research`,
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string" as const,
            description: "The research query to investigate",
          },
          effort: {
            type: "string" as const,
            enum: ["standard", "deep", "max"],
            default: "standard",
            description: "Research effort level",
          },
          context: {
            type: "string" as const,
            description: "Additional context for the research",
          },
        },
        required: ["query"],
      },
      execute: async (
        input: DeepResearchInput,
        options?: {
          onProgress?: (p: { progress?: number; message?: string }) => void;
          signal?: AbortSignal;
        },
      ) => {
        const events: string[] = [];

        try {
          const generator = useCase.research(input.query, {
            effort: input.effort,
            context: input.context,
            abortSignal: options?.signal,
          });

          let finalResult: ResearchResult | undefined;

          for await (const event of generator) {
            // Report progress
            if (event.type === "progress-update") {
              options?.onProgress?.({
                progress: event.progress,
                message: event.message,
              });
              events.push(
                `[${Math.round(event.progress * 100)}%] ${event.message}`,
              );
            } else if (event.type === "phase-started") {
              options?.onProgress?.({ message: event.message });
              events.push(`> ${event.message}`);
            } else if (event.type === "finding-discovered") {
              events.push(`Finding: ${event.finding}`);
            } else if (event.type === "quality-check") {
              events.push(
                `Quality: ${Math.round(event.score * 100)}% ${event.isSOTA ? "(SOTA)" : ""}`,
              );
            }
          }

          // Get the return value from the generator
          const result = await generator.next();
          if (result.done && result.value) {
            finalResult = result.value as ResearchResult;
          }

          return {
            success: true,
            data: {
              status: finalResult?.status,
              stats: finalResult?.stats,
              synthesis: finalResult?.synthesis,
              sources: finalResult?.sources?.slice(0, 20),
              quality: finalResult?.quality,
              events: events.slice(-20),
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Research failed",
          };
        }
      },
    },
  ];
}

export { DeepResearchInputSchema };
