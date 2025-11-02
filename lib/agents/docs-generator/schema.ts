/**
 * Docs Generator Agent Schema
 */

import { z } from 'zod';

export const docsGeneratorSchema = z.object({
  title: z
    .string()
    .describe('Feature title (user-facing, e.g., "User Authentication")'),

  summary: z
    .string()
    .describe('1-2 sentence summary of what users can do with this feature'),

  content: z
    .string()
    .describe('Main documentation content in markdown format. Explain what users can do, not implementation details.'),

  codeExamples: z
    .array(
      z.object({
        title: z
          .string()
          .describe('Example title (e.g., "Login with Email and Password")'),
        description: z
          .string()
          .describe('What this code does from user perspective'),
        code: z
          .string()
          .describe('Code snippet showing the implementation'),
        language: z
          .string()
          .describe('Programming language (e.g., "typescript", "python")'),
        sourceFile: z
          .string()
          .describe('Source file path (e.g., "src/auth/login.ts")'),
        lineNumber: z
          .number()
          .describe('Starting line number in the source file'),
      })
    )
    .min(1)
    .describe('Code examples (at least 1 required)'),

  relatedFeatures: z
    .array(z.string())
    .optional()
    .describe('Names of related features users might want to explore'),
});
