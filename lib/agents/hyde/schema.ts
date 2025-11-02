/**
 * HyDE Agent Schema
 */

import { z } from 'zod';

export const hydeSchema = z.object({
  originalQuery: z
    .string()
    .describe('The original user query'),

  expandedQueries: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe('Alternative phrasings of the query (2-5 variations)'),

  hypotheticalCode: z
    .array(
      z.object({
        description: z
          .string()
          .describe('What this code would do'),
        code: z
          .string()
          .describe('Hypothetical code snippet that would answer the query'),
      })
    )
    .min(1)
    .max(3)
    .describe('Hypothetical code examples (1-3 snippets)'),

  hypotheticalDocs: z
    .array(
      z.object({
        title: z
          .string()
          .describe('Documentation section title'),
        content: z
          .string()
          .describe('Documentation content that would explain this feature'),
      })
    )
    .min(1)
    .max(2)
    .describe('Hypothetical documentation (1-2 sections)'),
});
