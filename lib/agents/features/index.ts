/**
 * Features Agent
 *
 * Detects user-facing features from code and documentation
 */

import { defineAgent } from '../shared';
import { featuresSchema } from './schema';
import { SYSTEM_MESSAGE, buildUserMessage } from './prompt';

// Export types
export type { FeaturesInput, FeaturesOutput, Feature } from './types';
export { featuresSchema as schema } from './schema';

// Define agent
export const featuresAgent = defineAgent({
  name: 'features',
  schema: featuresSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
  settings: {
    maxOutputTokens: 3000, // Can have many features
  },
});

// Export convenience function
export const execute = featuresAgent.execute.bind(featuresAgent);
