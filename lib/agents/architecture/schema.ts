/**
 * Code Architecture Agent Schema
 */

import { z } from 'zod';

export const architectureSchema = z.object({
  overview: z
    .string()
    .describe('High-level architecture overview (2-3 sentences)'),

  componentHierarchy: z
    .object({
      description: z
        .string()
        .describe('How components are organized'),
      structure: z
        .array(z.string())
        .describe('Component hierarchy as array (e.g., ["App → Router → Pages → Components"])'),
    })
    .optional()
    .describe('Component hierarchy (for frontend apps)'),

  dataFlow: z.object({
    description: z
      .string()
      .describe('Overall data flow explanation'),
    steps: z
      .array(
        z.object({
          step: z.string().describe('Step name (e.g., "User Action", "API Call")'),
          description: z.string().describe('What happens in this step'),
        })
      )
      .describe('Data flow steps in order'),
  }),

  apiStructure: z
    .object({
      description: z.string().describe('How API is organized'),
      endpoints: z
        .array(z.string())
        .describe('Key API endpoints or routes'),
    })
    .optional()
    .describe('API structure (if backend/API exists)'),

  patterns: z
    .array(
      z.object({
        pattern: z
          .string()
          .describe('Pattern name (e.g., "Repository Pattern", "Dependency Injection")'),
        usage: z
          .string()
          .describe('How this pattern is used in the codebase'),
        example: z
          .string()
          .describe('File or code example showing the pattern'),
      })
    )
    .describe('Key architectural patterns used'),
});
