/**
 * Code Summarizer Agent - Schema
 */

import { z } from 'zod';

export const codeSummarizerSchema = z.object({
  compressed: z
    .string()
    .describe('Compressed version of code (~50% of original size, preserving meaning)'),

  keyComponents: z
    .array(z.string())
    .optional()
    .default([])
    .describe('Main functions/methods/variables within this code'),

  purpose: z
    .string()
    .optional()
    .default('Code chunk')
    .describe('What this code does in one concise sentence'),

  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe('External dependencies/imports used by this code'),
});
