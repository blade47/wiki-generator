/**
 * Code Summarizer Agent
 *
 * Compresses large code chunks while preserving semantic meaning
 */

import { defineAgent } from '../shared';
import { codeSummarizerSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { CodeSummarizerInput, CodeSummarizerOutput } from './types';
export { codeSummarizerSchema as schema } from './schema';

// Define agent
export const codeSummarizerAgent = defineAgent({
  name: 'code-summarizer',
  schema: codeSummarizerSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    maxOutputTokens: 4000, // Enough for compressed code (500 chars target + metadata + safety buffer)
  },
});

// Export convenience function
export const execute = codeSummarizerAgent.execute.bind(codeSummarizerAgent);
