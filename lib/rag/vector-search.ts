/**
 * Vector Search - Simple semantic search using cosine similarity
 */

import type { CodeChunk } from './types';

/**
 * Search result with chunk and score
 */
export interface SearchResult {
  chunk: CodeChunk;
  score: number;
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Vector search using cosine similarity
 */
export function vectorSearch(
  queryEmbedding: number[],
  chunks: CodeChunk[],
  topK = 100
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const chunk of chunks) {
    if (!chunk.embedding) continue;

    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    results.push({ chunk, score });
  }

  // Sort by score (descending) and return top-k
  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}
