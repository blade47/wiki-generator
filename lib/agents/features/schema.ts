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
        importance: z
          .number()
          .optional()
          .describe('Importance score (1-10, optional - defaults to 5 if omitted): 10=critical core feature, 7-9=major feature, 4-6=useful enhancement, 1-3=minor utility'),
        relatedChunks: z
          .array(z.string())
          .describe('Array of chunk IDs that implement this feature'),
        category: z
          .string()
          .optional()
          .default('General')
          .describe('Category (e.g., "Authentication", "Data Management", "UI/UX", "Search"). Defaults to "General" if unclear.'),
      })
    )
    .describe('List of user-facing features detected in the repository'),

  summary: z
    .string()
    .describe('1-2 sentence summary of what users can do with this application'),
});
