/**
 * Features Agent Schema
 */

import { z } from 'zod';

export const featuresSchema = z.object({
  features: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Feature name from user perspective (e.g., "User Authentication", not "AuthService")'),
        description: z
          .string()
          .describe('What users can DO with this feature (e.g., "Users can log in with email and password")'),
        relatedChunks: z
          .array(z.string())
          .describe('Array of chunk IDs that implement this feature'),
        category: z
          .string()
          .describe('Category (e.g., "Authentication", "Data Management", "UI/UX", "Search")'),
      })
    )
    .describe('List of user-facing features detected in the repository'),

  summary: z
    .string()
    .describe('1-2 sentence summary of what users can do with this application'),
});
