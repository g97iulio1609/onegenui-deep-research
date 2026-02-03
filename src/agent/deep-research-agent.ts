/**
 * Deep Research Agent - ToolLoopAgent-based implementation
 * Uses AI SDK 6 ToolLoopAgent for agentic research workflow
 */
import { ToolLoopAgent, tool, stepCountIs, generateText } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import pLimit from "p-limit";
import type { EffortLevel, EffortConfig } from "../domain/effort-level.schema.js";
import { EFFORT_PRESETS } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";

// Use web-search package for actual search/scrape
// @ts-ignore - no declaration file available
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
    // Map-reduce batch summarization
    batchSummaries: [] as { batchNum: number; summary: string; sourceCount: number }[],
    summarizedUrls: new Set<string>(), // Track which URLs have been summarized
    pendingSummaryPromises: [] as Promise<void>[], // Array of parallel summary promises
    batchCounter: 0, // Unique batch number counter
    stepCount: 0,
  };

  // Configuration for batch summarization
  const BATCH_SIZE = 5; // Summarize every 5 scraped sources

  // Function to summarize a batch of content in background
  const summarizeBatch = async (batchNum: number, contents: Array<{ url: string; content: string; title: string }>) => {
    if (contents.length === 0) return;

    console.log(`[DeepResearch] Starting batch ${batchNum} summarization (${contents.length} sources)...`);

    const contentText = contents.map((c, i) =>
      `### Source ${i + 1}: ${c.title}\nURL: ${c.url}\n${c.content.slice(0, 4000)}\n`
    ).join('\n---\n');

    const summaryPrompt = `You are extracting key information from research sources.

## SOURCES TO ANALYZE
${contentText}

## YOUR TASK
For EACH source above, extract:
1. Main facts and data points
2. Key quotes or statements
3. Unique insights not likely found elsewhere
4. Any contradictions with common knowledge

Write a COMPREHENSIVE summary (500-800 words) that captures ALL important information from these sources. Be specific - include names, dates, numbers, and direct quotes where relevant.

Format as structured bullet points grouped by theme.`;

    try {
      const result = await generateText({
        model,
        prompt: summaryPrompt,
        maxOutputTokens: 4000,
      });

      if (result.text) {
        state.batchSummaries.push({
          batchNum,
          summary: result.text,
          sourceCount: contents.length,
        });
        console.log(`[DeepResearch] Batch ${batchNum} summarized: ${result.text.length} chars`);
      }
    } catch (error) {
      console.error(`[DeepResearch] Batch ${batchNum} summarization failed:`, error);
    }
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
        console.log(`[DeepResearch] webSearch tool called - query: "${query.slice(0, 50)}...", type: ${searchType}`);
        onProgress?.({
          type: "phase-started",
          timestamp: new Date(),
          researchId: "agent",
          phase: "searching",
          message: `Searching: ${query}`,
        });

        try {
          console.log(`[DeepResearch] Calling webSearch.search()...`);
          const response = await webSearch.search(query, {
            maxResults: Math.min(10, Math.ceil(effortConfig.maxSources / 3)),
            searchType,
            timeout: 45000,
            cache: true,
          });
          console.log(`[DeepResearch] webSearch.search() returned:`, JSON.stringify(response.results).slice(0, 500));

          const results = response.results.results || [];
          console.log(`[DeepResearch] Processing ${results.length} results, first result:`, results[0] ? JSON.stringify(results[0]).slice(0, 200) : 'none');

          // Store sources
          let addedCount = 0;
          const newUrls: string[] = [];
          for (const result of results) {
            // Extract real URL from DuckDuckGo redirect URLs if needed
            let realUrl = result.url;
            if (realUrl && realUrl.includes('duckduckgo.com/l/?uddg=')) {
              try {
                // URL is encoded in the uddg parameter
                const match = realUrl.match(/uddg=([^&]+)/);
                if (match) {
                  realUrl = decodeURIComponent(match[1]);
                }
              } catch {
                // Keep original if decoding fails
              }
            }
            // Also handle protocol-relative URLs
            if (realUrl && realUrl.startsWith('//')) {
              realUrl = 'https:' + realUrl;
            }

            console.log(`[DeepResearch] Processing URL: ${result.url?.slice(0, 50)} -> ${realUrl?.slice(0, 50)}`);

            if (realUrl && !state.sources.has(realUrl)) {
              try {
                const urlObj = new URL(realUrl);
                state.sources.set(realUrl, {
                  url: realUrl,
                  title: result.title || urlObj.hostname,
                  domain: urlObj.hostname.replace("www.", ""),
                  snippet: result.snippet,
                });
                newUrls.push(realUrl);
                addedCount++;
              } catch (e) {
                console.log(`[DeepResearch] Invalid URL: ${realUrl}`, e);
              }
            }
          }
          console.log(`[DeepResearch] Added ${addedCount} sources, total: ${state.sources.size}`);

          // PARALLEL SCRAPING: Fire-and-forget (don't await - runs in background)
          const urlsToScrape = newUrls
            .filter(url => !state.scrapedContent.has(url))
            .slice(0, 5); // Scrape up to 5 new URLs per search

          if (urlsToScrape.length > 0) {
            console.log(`[DeepResearch] Starting background scraping for ${urlsToScrape.length} URLs...`);
            const limit = pLimit(3); // Max 3 concurrent scrapes

            // Fire-and-forget: don't await, let it run in background
            Promise.all(
              urlsToScrape.map(url =>
                limit(async () => {
                  try {
                    const response = await webSearch.scrape(url, {
                      timeout: 10000, // Reduced timeout
                      maxContentLength: 15000,
                      cache: true,
                    });
                    const content = response.result.content;
                    if (content) {
                      state.scrapedContent.set(url, content);
                      console.log(`[DeepResearch] Background scraped: ${url.slice(0, 50)}... (${content.split(/\s+/).length} words)`);
                    }
                  } catch (e) {
                    console.log(`[DeepResearch] Background scrape failed: ${url.slice(0, 50)}...`);
                  }
                })
              )
            ).then(() => {
              console.log(`[DeepResearch] Background scraping complete: ${state.scrapedContent.size} total scraped`);
            }).catch(err => {
              console.error(`[DeepResearch] Background scraping error:`, err);
            });
          }


          return {
            found: results.length,
            scraped: state.scrapedContent.size,
            sources: results.slice(0, 8).map((r: { title?: string; url?: string; snippet?: string }) => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };
        } catch (error) {
          return {
            found: 0,
            scraped: 0,
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
              content: content.slice(0, 8000), // Give model substantial content for synthesis
              excerpt: content.slice(0, 500), // Short preview
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
      const sourcesFound = state.sources.size;
      const sourcesScraped = state.scrapedContent.size;
      const scrapeRatio = sourcesFound > 0 ? sourcesScraped / sourcesFound : 0;
      const minScrapesRequired = Math.ceil(effortConfig.maxSources * 0.5); // At least 50% of sources

      // Dynamic phase limits based on maxSteps
      const searchPhaseEnd = 5;
      const forceScrapePhaseEnd = Math.floor(effortConfig.maxSteps * 0.6); // 60% of steps for mandatory scraping
      const continueScrapingEnd = Math.floor(effortConfig.maxSteps * 0.8); // 80% of steps can still force scrape

      console.log(`[DeepResearch] prepareStep - step: ${stepNumber}, sources: ${sourcesFound}, scraped: ${sourcesScraped}, ratio: ${(scrapeRatio * 100).toFixed(1)}%`);

      // Phase 1: Initial search phase (first 5 steps) - force search to build source pool
      if (stepNumber <= searchPhaseEnd) {
        console.log(`[DeepResearch] Phase 1: Forcing search (step ${stepNumber}/${searchPhaseEnd})`);
        return {
          activeTools: ["webSearch", "getResearchStatus"],
          toolChoice: { type: "tool", toolName: "webSearch" },
        };
      }

      // Phase 2: Mandatory scraping phase (until 60% of steps) - FORCE scraping if we have sources but haven't scraped enough
      if (stepNumber <= forceScrapePhaseEnd && sourcesFound > 5 && scrapeRatio < 0.5) {
        console.log(`[DeepResearch] Phase 2: Forcing scrape (step ${stepNumber}/${forceScrapePhaseEnd}, ratio ${(scrapeRatio * 100).toFixed(1)}% < 50%)`);
        return {
          activeTools: ["scrapeContent", "recordFinding", "getResearchStatus"],
          toolChoice: { type: "tool", toolName: "scrapeContent" },
        };
      }

      // Phase 3: Continue scraping if we still haven't met minimums (until 80% of steps)
      if (stepNumber <= continueScrapingEnd && sourcesScraped < minScrapesRequired && sourcesFound > sourcesScraped) {
        console.log(`[DeepResearch] Phase 3: Continue scraping (step ${stepNumber}/${continueScrapingEnd}, ${sourcesScraped}/${minScrapesRequired} required)`);
        return {
          activeTools: ["scrapeContent", "recordFinding", "webSearch", "getResearchStatus"],
          toolChoice: { type: "tool", toolName: "scrapeContent" },
        };
      }

      // Phase 4: Open phase - all tools available, agent decides
      // But hint towards scraping if we have many unscraped sources
      if (sourcesFound > sourcesScraped * 2) {
        console.log(`[DeepResearch] Phase 4 (open): Hint scrape (many unscraped sources)`);
        return {
          activeTools: ["scrapeContent", "recordFinding", "webSearch", "getResearchStatus"],
        };
      }

      console.log(`[DeepResearch] Phase 4 (open): All tools available`);
      return {
        activeTools: ["webSearch", "scrapeContent", "recordFinding", "getResearchStatus"],
      };
    },
    onStepFinish: (step) => {
      // Track step count in state
      state.stepCount++;

      console.log(`[DeepResearch] onStepFinish - step ${state.stepCount}, sources: ${state.sources.size}, scraped: ${state.scrapedContent.size}`);

      // Check if we have enough new scraped content to trigger batch summarization
      const allScrapedUrls = Array.from(state.scrapedContent.keys());
      const unsummarizedUrls = allScrapedUrls.filter(url => !state.summarizedUrls.has(url));

      if (unsummarizedUrls.length >= BATCH_SIZE) {
        // Get the first BATCH_SIZE unsummarized URLs
        const batchUrls = unsummarizedUrls.slice(0, BATCH_SIZE);
        const batchContents = batchUrls.map(url => ({
          url,
          content: state.scrapedContent.get(url) || '',
          title: state.sources.get(url)?.title || new URL(url).hostname,
        }));

        // Mark these URLs as summarized BEFORE starting the async operation
        batchUrls.forEach(url => state.summarizedUrls.add(url));

        state.batchCounter++;
        const batchNum = state.batchCounter;

        console.log(`[DeepResearch] Triggering batch ${batchNum} summarization (${batchContents.length} sources) in background`);

        // Fire-and-forget: start summarization in parallel
        // We push to array and wait for all at the end
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
    },
  });

  return {
    agent,
    state,

    async research(query: string, context?: string): Promise<DeepResearchAgentResult> {
      const prompt = context
        ? `Research query: ${query}\n\nAdditional context: ${context}`
        : `Research query: ${query}`;

      console.log(`[DeepResearch] Starting research - query length: ${query.length}, effort: ${effort}`);

      onProgress?.({
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "decomposing",
        message: "Starting research...",
      });

      console.log(`[DeepResearch] Calling agent.generate with prompt length: ${prompt.length}`);
      console.log(`[DeepResearch] Agent config - maxSteps: ${effortConfig.maxSteps}, maxTokens: ${maxTokens}`);
      console.log(`[DeepResearch] Tools available: ${Object.keys(researchTools).join(', ')}`);

      const startGenTime = Date.now();
      try {
        // Phase 1: Research Collection (using ToolLoopAgent)
        await agent.generate({ prompt });
        console.log(`[DeepResearch] Research collection completed in ${Date.now() - startGenTime}ms`);
        console.log(`[DeepResearch] Collected: ${state.sources.size} sources, ${state.scrapedContent.size} scraped, ${state.findings.length} findings`);
      } catch (genError) {
        console.error(`[DeepResearch] Research collection FAILED after ${Date.now() - startGenTime}ms:`, genError);
        throw genError;
      }

      // Phase 2: Explicit Synthesis with all collected data
      onProgress?.({
        type: "phase-started",
        timestamp: new Date(),
        researchId: "agent",
        phase: "synthesizing",
        message: "Waiting for batch summaries and writing report...",
      });

      // Wait for ALL pending batch summarizations to complete (they run in parallel)
      if (state.pendingSummaryPromises.length > 0) {
        console.log(`[DeepResearch] Waiting for ${state.pendingSummaryPromises.length} parallel batch summaries...`);
        await Promise.all(state.pendingSummaryPromises);
      }

      // Summarize any remaining un-summarized content
      const allUrls = Array.from(state.scrapedContent.keys());
      const remainingUrls = allUrls.filter(url => !state.summarizedUrls.has(url));
      if (remainingUrls.length > 0) {
        console.log(`[DeepResearch] Summarizing final batch of ${remainingUrls.length} remaining sources`);
        const finalBatchContents = remainingUrls.map(url => ({
          url,
          content: state.scrapedContent.get(url) || '',
          title: state.sources.get(url)?.title || new URL(url).hostname,
        }));
        remainingUrls.forEach(url => state.summarizedUrls.add(url));
        state.batchCounter++;
        await summarizeBatch(state.batchCounter, finalBatchContents);
      }

      console.log(`[DeepResearch] Synthesis phase: ${state.batchSummaries.length} batch summaries, ${state.findings.length} findings`);

      const effortRequirements = getEffortRequirements(effort, effortConfig);

      // Build synthesis prompt with BATCH SUMMARIES (map-reduce output)
      const findingsList = state.findings.map((f, i) => `${i + 1}. ${f}`).join('\n');
      const sourcesList = Array.from(state.sources.values())
        .slice(0, 30)
        .map(s => `- [${s.title}](${s.url})`)
        .join('\n');

      // Use batch summaries instead of raw content
      const batchSummariesText = state.batchSummaries
        .map(b => `### Batch ${b.batchNum} Summary (${b.sourceCount} sources)\n${b.summary}`)
        .join('\n\n---\n\n');

      const synthesisPrompt = `You are writing a **${effort.toUpperCase()}-LEVEL** comprehensive research report.

## ORIGINAL QUERY
${query}
${context ? `\nContext: ${context}` : ''}

## RESEARCH FINDINGS (${state.findings.length} key points extracted during research)
${findingsList || 'No specific findings recorded.'}

## SOURCES DISCOVERED (${state.sources.size} total sources)
${sourcesList}

## SUMMARIZED RESEARCH (${state.batchSummaries.length} batches, ${state.scrapedContent.size} sources analyzed)
The following are comprehensive summaries extracted from the sources during research:

${batchSummariesText}

---

## YOUR TASK
Using ALL the summarized research material above, write a **comprehensive ${effort.toUpperCase()}-level research report**.

${effortRequirements.reportInstructions}

## REQUIREMENTS
- **Word count**: ${effortRequirements.minWords} - ${effortRequirements.maxWords} words (MANDATORY)
- **Sections**: ${effortRequirements.sections} minimum
- **Quality**: ${effortRequirements.qualityStandards}

CRITICAL INSTRUCTIONS:
1. Use the ACTUAL facts, quotes, and data from the batch summaries above
2. Cite specific information with source references
3. Provide in-depth analysis, not surface-level summaries
4. Each section must be substantial (400+ words)`;

      console.log(`[DeepResearch] Synthesis prompt length: ${synthesisPrompt.length} chars`);

      const synthesisStart = Date.now();
      let synthesisResult;
      try {
        synthesisResult = await generateText({
          model,
          prompt: synthesisPrompt,
          maxOutputTokens: maxTokens,
        });
        console.log(`[DeepResearch] Synthesis completed in ${Date.now() - synthesisStart}ms - text length: ${synthesisResult.text?.length ?? 0}`);
      } catch (synthError) {
        console.error(`[DeepResearch] Synthesis FAILED:`, synthError);
        throw synthError;
      }

      onProgress?.({
        type: "completed",
        timestamp: new Date(),
        researchId: "agent",
        totalDurationMs: Date.now() - state.startTime,
        finalQuality: state.findings.length > 0 ? 0.8 : 0.5,
      });

      return {
        synthesis: synthesisResult.text,
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
  const effortRequirements = getEffortRequirements(effort, config);

  return `You are a DEEP RESEARCH agent producing **${effort.toUpperCase()}-LEVEL** comprehensive research.

## 📊 EFFORT LEVEL: ${effort.toUpperCase()}
${effortRequirements.summary}

### Research Parameters:
- **Sources to Find**: ${config.maxSources} minimum
- **Sources to Scrape**: ${effortRequirements.sourcesToScrape} minimum
- **Maximum Steps**: ${config.maxSteps}
- **Report Word Count**: ${effortRequirements.minWords} - ${effortRequirements.maxWords} words (MANDATORY)
- **Report Sections**: ${effortRequirements.sections} minimum

## 🔍 MANDATORY RESEARCH PHASES

### PHASE 1: COMPREHENSIVE SEARCH (steps 1-${effortRequirements.searchSteps})
Perform ${effortRequirements.searchQueries}+ different web searches with varied queries:
- Primary query with different phrasings and synonyms
- Academic and technical terminology variants
- Current events and recent news angle
- Industry/expert perspective queries
- Historical context and background queries
${effort !== 'standard' ? `- Comparative and competitive analysis queries
- Contrarian/alternative viewpoint queries` : ''}
${effort === 'max' ? `- International/regional perspective queries
- Edge case and exception queries
- Future trends and predictions queries` : ''}

### PHASE 2: DEEP CONTENT EXTRACTION (steps ${effortRequirements.searchSteps + 1}-${Math.ceil(config.maxSteps * 0.7)})
You MUST scrape content from AT LEAST ${effortRequirements.sourcesToScrape} of the found sources:
- Use scrapeContent on EVERY high-quality URL
- Prioritize authoritative sources (academic, government, industry leaders)
- Extract full article content, not just snippets
- Do NOT skip this phase - search snippets are INSUFFICIENT for ${effort} research

### PHASE 3: FINDING EXTRACTION (ongoing)
For EACH scraped source, use recordFinding to log:
- Key facts, data points, and statistics
- Expert quotes and authoritative statements
- Unique insights not found elsewhere
${effort !== 'standard' ? `- Contradictions between sources
- Emerging trends and patterns` : ''}
${effort === 'max' ? `- Minority/contrarian opinions
- Gaps in available information
- Areas of uncertainty or debate` : ''}

### PHASE 4: FINAL SYNTHESIS (CRITICAL)
After ALL research is complete, write a COMPREHENSIVE ${effort.toUpperCase()}-level report.

${effortRequirements.reportInstructions}

## ⚠️ CRITICAL RULES
1. **DO NOT** finish early - use all ${config.maxSteps} available steps
2. **DO NOT** rely only on search snippets - SCRAPE the actual pages
3. **DO NOT** skip the scrapeContent tool - it's essential
4. **DO NOT** write a timeline or list of events - write an analytical REPORT
5. Check getResearchStatus regularly:
   - If sourcesScraped < ${Math.ceil(effortRequirements.sourcesToScrape * 0.5)}, keep scraping more URLs
   - If findingsRecorded < ${Math.ceil(effortRequirements.minFindings * 0.5)}, keep recording findings
6. Your final synthesis MUST be ${effortRequirements.minWords}+ words with ${effortRequirements.sections}+ sections

## 🎯 QUALITY STANDARDS FOR ${effort.toUpperCase()} LEVEL
${effortRequirements.qualityStandards}

Your research quality and report comprehensiveness directly determines success. A ${effort}-level report that does not meet word count and section requirements is UNACCEPTABLE.`;
}

interface EffortRequirements {
  summary: string;
  sourcesToScrape: number;
  searchSteps: number;
  searchQueries: number;
  minWords: number;
  maxWords: number;
  sections: number;
  minFindings: number;
  reportInstructions: string;
  qualityStandards: string;
}

function getEffortRequirements(effort: EffortLevel, config: EffortConfig): EffortRequirements {
  switch (effort) {
    case 'standard':
      return {
        summary: 'Solid, comprehensive research report with key insights',
        sourcesToScrape: Math.ceil(config.maxSources * 0.4),
        searchSteps: 5,
        searchQueries: 5,
        minWords: 2500,
        maxWords: 4000,
        sections: 5,
        minFindings: 10,
        reportInstructions: `**REQUIRED STRUCTURE:**
## Executive Summary (300-500 words)
## 1. Introduction & Background
## 2. Key Findings (with evidence and citations)
## 3. Analysis & Implications
## 4. Challenges & Considerations
## 5. Conclusions & Recommendations
## References`,
        qualityStandards: `- Clear, well-organized presentation
- Multiple sources cited per major claim
- Practical, actionable insights
- Professional tone and formatting`,
      };

    case 'deep':
      return {
        summary: 'Thorough, multi-perspective analysis with detailed evidence',
        sourcesToScrape: Math.ceil(config.maxSources * 0.5),
        searchSteps: 8,
        searchQueries: 10,
        minWords: 5000,
        maxWords: 8000,
        sections: 8,
        minFindings: 20,
        reportInstructions: `**REQUIRED STRUCTURE:**
## Executive Summary (500-700 words - comprehensive overview)
## 1. Introduction
### 1.1 Background & Context
### 1.2 Research Scope
## 2. Current State of Knowledge
### 2.1 Primary Findings
### 2.2 Supporting Evidence
## 3. In-Depth Analysis
### 3.1 Trend Analysis
### 3.2 Comparative Perspectives
## 4. Multiple Perspectives
### 4.1 Mainstream Views
### 4.2 Alternative Perspectives
### 4.3 Points of Agreement & Disagreement
## 5. Implications & Impact
## 6. Challenges & Limitations
## 7. Future Outlook
## 8. Conclusions & Recommendations
## References`,
        qualityStandards: `- Thorough exploration of multiple angles
- Detailed evidence with specific data points
- Analysis of contradictions between sources
- Nuanced conclusions considering different perspectives
- Substantial depth in each section (400-700 words per section)`,
      };

    case 'max':
      return {
        summary: 'Exhaustive, publication-quality analysis leaving no stone unturned',
        sourcesToScrape: Math.ceil(config.maxSources * 0.6),
        searchSteps: 12,
        searchQueries: 15,
        minWords: 10000,
        maxWords: 15000,
        sections: 12,
        minFindings: 30,
        reportInstructions: `**REQUIRED STRUCTURE (12+ sections):**
## Executive Summary (800-1200 words - comprehensive synthesis)
## 1. Introduction
### 1.1 Research Context & Significance
### 1.2 Historical Background
### 1.3 Scope & Methodology
## 2. Literature Review & Current Knowledge
### 2.1 Foundational Concepts
### 2.2 Evolution of Understanding
## 3. Primary Research Findings
### 3.1 Core Discoveries
### 3.2 Supporting Data & Evidence
## 4. Comprehensive Analysis
### 4.1 Trend Analysis
### 4.2 Pattern Recognition
### 4.3 Causal Relationships
## 5. Multi-Stakeholder Perspectives
### 5.1 Expert Opinions
### 5.2 Industry Perspectives
### 5.3 Contrarian & Minority Views
## 6. Contradictions & Debates
### 6.1 Areas of Disagreement
### 6.2 Unresolved Questions
## 7. Case Studies & Examples
## 8. Implications Analysis
### 8.1 Short-term Impact
### 8.2 Long-term Consequences
### 8.3 Potential Risks
## 9. Limitations & Research Gaps
## 10. Future Outlook & Predictions
## 11. Conclusions (comprehensive synthesis)
## 12. Strategic Recommendations
## Appendix: Detailed Source Analysis
## References`,
        qualityStandards: `- Publication-quality depth and rigor
- Exhaustive coverage of all perspectives
- Detailed analysis of contradictions and debates
- Specific case studies and examples
- Statistical analysis where applicable
- Expert-level synthesis and original insights
- Substantial depth (700-1200 words per major section)
- At least 30 unique findings recorded
- Minority/contrarian views explored`,
      };
  }
}

