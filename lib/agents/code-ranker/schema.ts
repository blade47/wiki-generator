/**
 * Code Ranker Agent Schema
 */

import { z } from 'zod';

export const codeRankerSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('Total relevance score (0-10)'),
  relevance: z
    .number()
    .min(0)
    .max(4)
    .describe('How well code relates to query (0-4)'),
  completeness: z
    .number()
    .min(0)
    .max(3)
    .describe('Does it provide complete answer (0-3)'),
  quality: z
    .number()
    .min(0)
    .max(3)
    .describe('Right level of detail (0-3)'),
  explanation: z
    .string()
    .describe('Brief explanation of the score (1-2 sentences)'),
});
