/**
 * Code Ranker Agent
 *
 * LLM-based relevance scoring for final reranking
 */

import { defineAgent } from '../shared';
import { codeRankerSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { CodeRankerInput, CodeRankerOutput } from './types';
export { codeRankerSchema as schema } from './schema';

// Define agent
export const codeRankerAgent = defineAgent({
  name: 'code-ranker',
  schema: codeRankerSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    temperature: 0.1, // Very low for consistent scoring
    maxOutputTokens: 500, // Small response (just scores + explanation)
  },
});

// Export convenience function
export const execute = codeRankerAgent.execute.bind(codeRankerAgent);
