/**
 * AI SDK LLM Adapter - bridges deep-research to Vercel AI SDK
 * Follows KISS principle: reuses existing generateObject/generateText
 */
import { generateObject, generateText, embed } from "ai";
import type { LanguageModelV1 } from "ai";
import { z } from "zod";
import type { LLMPort, LLMOptions, LLMResponse } from "../ports/llm.port.js";

export interface AiSdkLlmAdapterOptions {
  model: LanguageModelV1;
  embeddingModel?: Parameters<typeof embed>[0]["model"];
}

export class AiSdkLlmAdapter implements LLMPort {
  constructor(private options: AiSdkLlmAdapterOptions) {}

  async generate<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: LLMOptions,
  ): Promise<LLMResponse<T>> {
    const result = await generateObject({
      model: this.options.model,
      schema,
      prompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return {
      data: result.object,
      usage: {
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  }

  async generateText(prompt: string, options?: LLMOptions): Promise<string> {
    const result = await generateText({
      model: this.options.model,
      prompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return result.text;
  }

  async *streamText(
    prompt: string,
    options?: LLMOptions,
  ): AsyncGenerator<string, void, unknown> {
    // For now, fallback to non-streaming (can be enhanced later)
    const text = await this.generateText(prompt, options);
    yield text;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.options.embeddingModel) {
      throw new Error("Embedding model not configured");
    }

    const result = await embed({
      model: this.options.embeddingModel,
      value: text,
    });

    return result.embedding;
  }

  async similarity(text1: string, text2: string): Promise<number> {
    const [emb1, emb2] = await Promise.all([
      this.embed(text1),
      this.embed(text2),
    ]);
    return this.cosineSimilarity(emb1, emb2);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
