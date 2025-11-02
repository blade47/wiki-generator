/**
 * Code Summarizer Agent - Types
 */

import type { z } from 'zod';
import type { codeSummarizerSchema } from './schema';
import type { CodeChunk } from '@/lib/rag/types';

// Output inferred from schema
export type CodeSummarizerOutput = z.infer<typeof codeSummarizerSchema>;

// Input defined explicitly
export interface CodeSummarizerInput {
  chunk: CodeChunk;
  targetSize?: number; // Target size in characters (default: 500)
}
