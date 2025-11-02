import type { z } from 'zod';
import type { AgentSettings } from '../config';

/**
 * AI SDK message format
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Agent configuration - what you pass to defineAgent()
 */
export interface AgentConfig<TInput, TOutput> {
  name: string;
  schema: z.ZodSchema<TOutput>;
  systemMessage: string;
  buildUserMessage: (input: TInput) => string;
  settings?: AgentSettings;  // Optional, has defaults
}

/**
 * Agent interface - what defineAgent() returns
 */
export interface Agent<TInput, TOutput> {
  name: string;
  schema: z.ZodSchema<TOutput>;
  systemMessage: string;
  buildUserMessage: (input: TInput) => string;
  settings: Required<AgentSettings>;
  execute: (input: TInput) => Promise<TOutput>;
}
