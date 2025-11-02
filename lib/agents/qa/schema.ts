/**
 * Q&A Agent Schema
 */

import { z } from 'zod';

export const qaSchema = z.object({
  answer: z
    .string()
    .describe('Direct answer to the user\'s question. Be clear, concise, and user-focused.'),

  codeReferences: z
    .array(
      z.object({
        file: z.string().describe('Source file path'),
        lineNumber: z.number().describe('Starting line number'),
        description: z
          .string()
          .describe('What this code does in relation to the question'),
        code: z.string().describe('Relevant code snippet'),
      })
    )
    .describe('Code references supporting the answer (empty array if none)'),

  relatedDocs: z
    .array(z.string())
    .optional()
    .describe('Related documentation sections users might want to read'),

  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('Confidence level: high (direct answer in code), medium (inferred), low (uncertain)'),

  confidenceReason: z
    .string()
    .describe('Brief explanation of the confidence level'),
});
