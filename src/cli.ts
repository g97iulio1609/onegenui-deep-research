#!/usr/bin/env node
/**
 * Deep Research CLI
 *
 * Run deep research queries from the command line.
 * Usage: deep-research "query" [--effort standard|deep|max]
 */

import { createDeepResearch } from "./factory.js";
import type { LanguageModel } from "ai";

const args = process.argv.slice(2);

function printUsage() {
  console.log("deep-research - AI-powered deep research engine");
  console.log("");
  console.log("Usage:");
  console.log('  deep-research "your query"           Run a research query');
  console.log("  deep-research --help                 Show this help");
  console.log("");
  console.log("Options:");
  console.log("  --effort <level>  Effort level: standard (default), deep, max");
  console.log("  --output <file>   Output file (default: stdout)");
  console.log("");
  console.log("Note: Requires a configured AI model provider.");
  console.log("Set up via @onegenui/providers or provide a model instance.");
}

function parseArgs() {
  let query = "";
  let effort: "standard" | "deep" | "max" = "standard";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--effort" && args[i + 1]) {
      effort = args[++i] as "standard" | "deep" | "max";
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (!arg?.startsWith("--")) {
      query = arg ?? "";
    }
  }

  return { query, effort };
}

async function main() {
  const { query, effort } = parseArgs();

  if (!query) {
    console.error("Error: missing query");
    printUsage();
    process.exit(1);
  }

  console.log(`Query: ${query}`);
  console.log(`Effort: ${effort}`);
  console.log("---");

  try {
    // Try to create model from providers
    const { createModelForTask } = await import("@onegenui/providers");
    const model = await createModelForTask("deepresearch");

    const dr = createDeepResearch({ model: model as LanguageModel });
    const result = await dr.researchAsync(query, {
      effort,
      onProgress: (event) => {
        if ("message" in event) {
          console.log(`[${event.type}] ${String(event.message)}`);
        }
      },
    });

    console.log("---");
    console.log("Research Complete:");
    console.log(JSON.stringify({
      sources: result.stats?.totalSources ?? 0,
      quality: result.quality,
      synthesisLength: result.synthesis?.length ?? 0,
    }, null, 2));

    if (result.synthesis) {
      console.log("\nSynthesis:");
      console.log(result.synthesis);
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
