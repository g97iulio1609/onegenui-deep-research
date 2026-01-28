/**
 * LLM Port - interface for language model operations
 */
import { z } from "zod";

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMResponse<T> {
  data: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Port for LLM operations with structured output
 */
export interface LLMPort {
  /** Generate structured output using a Zod schema */
  generate<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: LLMOptions,
  ): Promise<LLMResponse<T>>;

  /** Generate text without structured output */
  generateText(prompt: string, options?: LLMOptions): Promise<string>;

  /** Stream text generation */
  streamText(
    prompt: string,
    options?: LLMOptions,
  ): AsyncGenerator<string, void, unknown>;

  /** Get embedding for text */
  embed(text: string): Promise<number[]>;

  /** Calculate semantic similarity between texts */
  similarity(text1: string, text2: string): Promise<number>;
}
