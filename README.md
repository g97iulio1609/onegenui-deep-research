# Deep Research Package

## Overview

The `@onegenui/deep-research` package provides state-of-the-art web research capabilities with three effort levels: Standard, Deep, and Max. It follows hexagonal architecture principles for clean separation of concerns and maximum testability.

## Features

- **3 Effort Levels**: Standard (~3 min), Deep (~10 min), Max (~30 min)
- **Multi-Source Search**: Academic (Semantic Scholar, arXiv), News, General Web
- **Parallel Execution**: Concurrent source fetching with configurable limits
- **Authentication Support**: Cookie, API Key, OAuth for premium sources
- **Rich Content Output**: Structured reports with citations, knowledge graphs, mind maps
- **Streaming Events**: Real-time progress updates during research

## Installation

```bash
pnpm add @onegenui/deep-research
```

## Architecture

```
src/
├── domain/          # Zod schemas for all data types
├── ports/           # Interface definitions
├── adapters/        # Port implementations
├── use-cases/       # Business logic orchestration
└── tools.ts         # MCP tool definition
```

### Ports (Interfaces)

| Port | Purpose |
|------|---------|
| `DeepSearchPort` | Web search operations |
| `ContentScraperPort` | Content extraction |
| `ContentAnalyzerPort` | LLM-based content analysis |
| `SourceRankerPort` | Credibility scoring |
| `KnowledgeGraphPort` | Entity relationships |
| `SynthesizerPort` | Report generation |
| `AuthPort` | Authentication management |

### Adapters (Implementations)

| Adapter | Description |
|---------|-------------|
| `DeepSearchAdapter` | DuckDuckGo HTML search (no API key) |
| `AcademicSearchAdapter` | Semantic Scholar + arXiv |
| `NewsSearchAdapter` | Google News RSS |
| `LightweightScraperAdapter` | HTTP-only content extraction |
| `ContentAnalyzerAdapter` | LLM entity/claim extraction |
| `SynthesizerAdapter` | LLM report generation |
| `KnowledgeGraphAdapter` | Entity aggregation |
| `AuthManagerAdapter` | Unified auth coordination |

## Usage

### Basic Research

```typescript
import { DeepResearchUseCase, EFFORT_PRESETS } from "@onegenui/deep-research";

const useCase = new DeepResearchUseCase({
  search: new DeepSearchAdapter(),
  scraper: new LightweightScraperAdapter(),
  analyzer: new ContentAnalyzerAdapter(llmPort),
  ranker: new SourceRankerAdapter(),
  knowledgeGraph: new KnowledgeGraphAdapter(),
  synthesizer: new SynthesizerAdapter(llmPort),
});

// Stream research events
for await (const event of useCase.research("Impact of AI on healthcare", {
  effort: "deep",
})) {
  console.log(event.type, event.data);
}
```

### With Progress Tracking

```typescript
const generator = useCase.research(query, { effort: "standard" });

for await (const event of generator) {
  switch (event.type) {
    case "phase_started":
      console.log(`Starting: ${event.phase}`);
      break;
    case "source_found":
      console.log(`Found: ${event.source.title}`);
      break;
    case "progress":
      console.log(`Progress: ${event.progress}%`);
      break;
    case "completed":
      console.log("Research complete!");
      break;
  }
}

// Get final result
const result = await generator.next();
console.log(result.value); // ResearchResult
```

### Authentication

```typescript
import { AuthManagerAdapter } from "@onegenui/deep-research";

const authManager = new AuthManagerAdapter();

// Add API key for Semantic Scholar
authManager.getApiKeyAdapter().setApiKey("semantic_scholar", "your-api-key");

// Import cookies from browser export
const cookieAdapter = authManager.getCookieAdapter();
await cookieAdapter.importFromJson(cookieJson);

// Check authentication status
const isAuthed = await authManager.isAuthenticated("twitter");
```

## Effort Levels

| Level | Max Steps | Timeout | Sources | Parallelism | Quality Threshold |
|-------|-----------|---------|---------|-------------|-------------------|
| Standard | 50 | 5 min | 25 | 10 | 0.75 |
| Deep | 100 | 15 min | 50 | 15 | 0.80 |
| Max | 200 | 45 min | 100 | 20 | 0.90 |

## Frontend Integration

The package integrates with `@onegenui/react` via the `DeepResearchSlice`:

```tsx
import { useDeepResearch } from "@onegenui/react";

function ResearchPanel() {
  const { startResearch, stopResearch, isResearching, progress } = useDeepResearch();

  return (
    <div>
      <button onClick={() => startResearch("my query")}>
        Start Research
      </button>
      {isResearching && <p>Progress: {progress}%</p>}
    </div>
  );
}
```

### UI Components

From `@onegenui/chat`:

- `DeepResearchSettings` - Settings panel with effort level selector
- `DeepResearchProgress` - Real-time progress indicator
- `DeepResearchReport` - Structured research report display

## Performance Considerations

1. **HTTP-Only Scraping**: The `LightweightScraperAdapter` uses native fetch for maximum performance, avoiding browser overhead.

2. **LRU Caching**: All adapters implement LRU caching with configurable TTLs to reduce redundant requests.

3. **Parallel Execution**: The orchestrator uses `p-limit` for controlled concurrency based on effort level.

4. **Early Stopping**: Research stops early when quality threshold is reached, saving time and resources.

## MCP Tool

The package exports an MCP tool for integration with AI agents:

```typescript
import { deepResearchTool } from "@onegenui/deep-research/tools";

// Register with your MCP server
mcpServer.registerTool(deepResearchTool);
```

## React Native Compatibility

This package is cross-platform compatible with React Native with the following considerations:

1. **`uuid` polyfill required** — Several adapters use `uuid` v4 which relies on `crypto.getRandomValues()`. On React Native, install and import the polyfill **before** any other import from this package:

   ```bash
   npm install react-native-get-random-values
   ```

   ```typescript
   // Must be the very first import in your app entry point
   import "react-native-get-random-values";
   import { createDeepResearch } from "@onegenui/deep-research";
   ```

2. **`@onegenui/web-search` dependency** — The `deep-research-agent` imports from `@onegenui/web-search`. If web-search's barrel export pulls in Node-specific modules (e.g., `fs`, `child_process`), the web-search package must provide React Native-safe exports. The specific adapters used (`OneCrawlSearchAdapter`, `OneCrawlScraperAdapter`) are themselves platform-agnostic.

3. **CLI excluded** — The `cli.ts` entry point uses Node APIs (`process.argv`) and is not exported from the library entry point. It is only available via the `bin` field for command-line use.

4. **`p-limit` and `lru-cache`** — Both are pure JavaScript, fully platform-agnostic.

## License

MIT
