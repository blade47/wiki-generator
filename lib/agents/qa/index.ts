/**
 * Q&A Agent
 *
 * Answers user questions using RAG-retrieved code
 */

import { defineAgent } from '../shared';
import { qaSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { QAInput, QAOutput } from './types';
export { qaSchema as schema } from './schema';

// Define agent
export const qaAgent = defineAgent({
  name: 'qa',
  schema: qaSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    temperature: 0.3, // Low for accurate answers
    maxOutputTokens: 2000,
  },
});

// Export convenience function
export const execute = qaAgent.execute.bind(qaAgent);
