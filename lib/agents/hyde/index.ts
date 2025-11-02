/**
 * HyDE Agent
 *
 * Generates hypothetical code and documentation to improve search quality
 * HyDE = Hypothetical Document Embeddings
 */

import { defineAgent } from '../shared';
import { hydeSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { HyDEInput, HyDEOutput } from './types';
export { hydeSchema as schema } from './schema';

// Define agent
export const hydeAgent = defineAgent({
  name: 'hyde',
  schema: hydeSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    temperature: 0.7, // Higher for creative hypothetical generation
    maxOutputTokens: 2000,
  },
});

// Export convenience function
export const execute = hydeAgent.execute.bind(hydeAgent);
