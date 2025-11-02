/**
 * Docs Generator Agent
 *
 * Generates user-facing documentation from features and code
 */

import { defineAgent } from '../shared';
import { docsGeneratorSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { DocsGeneratorInput, DocsGeneratorOutput } from './types';
export { docsGeneratorSchema as schema } from './schema';

// Define agent
export const docsGeneratorAgent = defineAgent({
  name: 'docs-generator',
  schema: docsGeneratorSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    maxOutputTokens: 3000, // Reduced from 4000 for speed (still detailed enough)
  },
});

// Export convenience function
export const execute = docsGeneratorAgent.execute.bind(docsGeneratorAgent);
