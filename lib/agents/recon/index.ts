/**
 * Recon Agent
 *
 * Analyzes repository structure, tech stack, and architecture
 */

import { defineAgent } from '../shared';
import { reconSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { ReconInput, ReconOutput } from './types';
export { reconSchema as schema } from './schema';

// Define agent
export const reconAgent = defineAgent({
  name: 'recon',
  schema: reconSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    temperature: 0.3, // Low for consistent analysis
    maxOutputTokens: 2000, // Enough for comprehensive analysis
  },
});

// Export convenience function
export const execute = reconAgent.execute.bind(reconAgent);
