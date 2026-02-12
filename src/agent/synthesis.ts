/**
 * Synthesis phase - generates the final research report from collected data
 */
import { generateText } from "ai";
import type { LanguageModel } from "ai";
import type { EffortLevel, EffortConfig } from "../domain/effort-level.schema.js";
import type { ResearchEvent } from "../domain/events.schema.js";
import type { ResearchState } from "./research-state.js";
import type { EffortRequirements } from "./effort-config.js";
import { getEffortRequirements } from "./effort-config.js";

export interface SynthesizeReportParams {
  state: ResearchState;
  query: string;
  context?: string;
  effort: EffortLevel;
  effortConfig: EffortConfig;
  model: LanguageModel;
  maxTokens: number;
  onPatch?: (patch: string) => void;
  onProgress?: (event: ResearchEvent) => void;
  summarizeBatch: (batchNum: number, contents: Array<{ url: string; content: string; title: string }>) => Promise<void>;
}

export interface SynthesisResult {
  synthesis: string;
  patchesStreamed: number;
}

export async function synthesizeReport(params: SynthesizeReportParams): Promise<SynthesisResult> {
  const { state, query, context, effort, effortConfig, model, maxTokens, onPatch, onProgress, summarizeBatch } = params;

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

  const effortRequirements: EffortRequirements = getEffortRequirements(effort, effortConfig);

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
  let patchesStreamed = 0;
  let fullText = "";

  // Generate synthesis using simple generateText
  try {
    const synthesisResult = await generateText({
      model,
      prompt: synthesisPrompt,
      maxOutputTokens: maxTokens,
    });
    fullText = synthesisResult.text ?? "";
    console.log(`[DeepResearch] Synthesis completed in ${Date.now() - synthesisStart}ms - text length: ${fullText.length}`);
  } catch (synthError) {
    console.error(`[DeepResearch] Synthesis FAILED:`, synthError);
    throw synthError;
  }

  // Parse the markdown report into structured sections for UI
  const sections: Array<{ title: string; content: string }> = [];
  const lines = fullText.split('\n');
  let currentTitle = "";
  let currentContent: string[] = [];
  let reportTitle = "";
  let reportSummary = "";

  for (const line of lines) {
    if (line.startsWith('# ') && !reportTitle) {
      reportTitle = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = line.slice(3).trim();
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }
  // Don't forget last section
  if (currentTitle && currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  if (!reportTitle) {
    reportTitle = query;
  }
  if (!reportSummary && sections.length > 0) {
    const summarySection = sections.find((s) => s.title.toLowerCase().includes("summary"));
    if (summarySection) {
      reportSummary = summarySection.content;
    }
  }
  if (!reportSummary && sections.length > 0) {
    reportSummary = sections[0]?.content ?? "";
  }

  // Stream patches to frontend if callback provided
  if (onPatch && sections.length > 0) {
    console.log(`[DeepResearch] Streaming ${sections.length} sections as ResearchReport patch`);
    const sources = Array.from(state.sources.values()).slice(0, 30).map((s, index) => ({
      id: String(index + 1),
      title: s.title,
      url: s.url,
      domain: s.domain,
    }));
    const reportPatch = JSON.stringify({
      op: "add",
      path: "/elements/research_report",
      value: {
        key: "research_report",
        type: "ResearchReport",
        props: {
          title: reportTitle || "Research Report",
          summary: reportSummary,
          sections: sections.map(s => ({
            title: s.title,
            content: s.content,
          })),
          sources,
          searchQuery: query,
          totalResults: state.sources.size,
        },
      },
    });
    const rootPatch = JSON.stringify({
      op: "set",
      path: "/root",
      value: "research_report",
    });
    onPatch(reportPatch);
    onPatch(rootPatch);
    patchesStreamed += 2;
    console.log(`[DeepResearch] Streamed ResearchReport patch with ${sections.length} sections`);
  }

  return { synthesis: fullText, patchesStreamed };
}
