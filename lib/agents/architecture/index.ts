/**
 * Code Architecture Agent
 *
 * Explains how the codebase is organized and how data flows
 */

import { defineAgent } from '../shared';
import { architectureSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { ArchitectureInput, ArchitectureOutput } from './types';
export { architectureSchema as schema } from './schema';

// Define agent
export const architectureAgent = defineAgent({
  name: 'architecture',
  schema: architectureSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    maxOutputTokens: 2500,
  },
});

// Export convenience function
export const execute = architectureAgent.execute.bind(architectureAgent);
