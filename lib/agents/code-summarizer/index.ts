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
    temperature: 0.2, // Low temperature for consistency
    maxOutputTokens: 2000, // Enough for compressed code
  },
});

// Export convenience function
export const execute = codeSummarizerAgent.execute.bind(codeSummarizerAgent);
