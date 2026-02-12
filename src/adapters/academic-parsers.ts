/**
 * Academic Search - XML parsing and credibility helpers
 */
import { v4 as uuid } from "uuid";
import type { Source, SourceType } from "../domain/source.schema.js";

export function parseArxivXml(
  xml: string,
): Omit<Source, "content" | "extractedAt">[] {
  const results: Omit<Source, "content" | "extractedAt">[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]!;

    const getId = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return m ? m[1]!.trim() : "";
    };

    const title = getId("title").replace(/\s+/g, " ");
    const summary = getId("summary").replace(/\s+/g, " ");
    const id = getId("id");
    const published = getId("published");

    if (title && id) {
      results.push({
        id: uuid(),
        url: id,
        title,
        snippet: summary.slice(0, 300),
        domain: "arxiv.org",
        sourceType: "academic" as SourceType,
        credibilityScore: 0.88,
        relevanceScore: 0.8,
        media: [],
        requiresAuth: false,
        publishedAt: published ? new Date(published) : undefined,
      });
    }
  }

  return results;
}

export function mapPaperToSource(
  paper: Record<string, unknown>,
  source: string,
): Omit<Source, "content" | "extractedAt"> {
  const authors = Array.isArray(paper.authors)
    ? paper.authors.map(
        (a: Record<string, unknown>) => (a.name as string) || "",
      )
    : [];

  return {
    id: uuid(),
    url:
      (paper.url as string) ||
      `https://semanticscholar.org/paper/${paper.paperId}`,
    title: (paper.title as string) || "Untitled",
    snippet: ((paper.abstract as string) || "").slice(0, 300),
    domain:
      source === "semantic_scholar" ? "semanticscholar.org" : "arxiv.org",
    sourceType: "academic" as SourceType,
    credibilityScore: calculateAcademicCredibility(paper),
    relevanceScore: 0.8,
    media: [],
    requiresAuth: false,
    author: authors.join(", "),
    publishedAt: paper.year ? new Date(`${paper.year}-01-01`) : undefined,
  };
}

export function calculateAcademicCredibility(
  paper: Record<string, unknown>,
): number {
  let score = 0.8;

  const citations = paper.citationCount as number | undefined;
  if (typeof citations === "number") {
    if (citations > 100) score += 0.1;
    else if (citations > 50) score += 0.07;
    else if (citations > 10) score += 0.05;
  }

  const year = paper.year as number | undefined;
  if (typeof year === "number" && year >= new Date().getFullYear() - 2) {
    score += 0.02;
  }

  return Math.min(score, 0.95);
}
