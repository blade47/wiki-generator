/**
 * Code Ranker Agent Types
 */

import type { CodeChunk } from '@/lib/rag/types';

export interface CodeRankerInput {
  query: string;
  chunk: CodeChunk;
}

export interface CodeRankerOutput {
  score: number;
  relevance: number;
  completeness: number;
  quality: number;
  explanation: string;
}
