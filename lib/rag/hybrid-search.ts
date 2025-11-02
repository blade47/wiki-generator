/**
 * Hybrid Search - Combines Vector + BM25 (dual) with Reciprocal Rank Fusion
 *
 * Three search methods:
 * 1. Vector search (semantic similarity via embeddings)
 * 2. BM25-Code (keyword search on actual code)
 * 3. BM25-Text (keyword search on metadata)
 *
 * Results merged using RRF (Reciprocal Rank Fusion)
 */

import type { CodeChunk } from './types';
import type { BM25Index } from './bm25';

/**
 * RRF constant (standard value)
 */
export const RRF_K = 60;

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
 * Search result with chunk and score
 */
export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  rank?: number;
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

/**
 * Reciprocal Rank Fusion - Merge multiple ranked lists
 * Formula: score = Σ 1/(k + rank_i) where k=60, rank is 1-indexed
 */
export function reciprocalRankFusion(
  resultSets: SearchResult[][],
  topK = 100,
  k = RRF_K
): SearchResult[] {
  const chunkScores = new Map<string, { chunk: CodeChunk; score: number }>();

  // Process each result set
  for (const results of resultSets) {
    results.forEach((result, index) => {
      const rank = index + 1; // 1-indexed
      const rrfScore = 1 / (k + rank);

      const existing = chunkScores.get(result.chunk.id);
      if (existing) {
        existing.score += rrfScore;
      } else {
        chunkScores.set(result.chunk.id, {
          chunk: result.chunk,
          score: rrfScore,
        });
      }
    });
  }

  // Convert to array and sort by RRF score
  return Array.from(chunkScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Hybrid Search Engine
 */
export class HybridSearch {
  constructor(
    private readonly chunks: CodeChunk[],
    private readonly codeBM25: BM25Index,
    private readonly textBM25: BM25Index
  ) {}

  /**
   * Search with all three methods and merge with RRF
   */
  async search(
    query: string,
    queryEmbedding: number[],
    topK = 100
  ): Promise<SearchResult[]> {
    // Run all three searches
    const vectorResults = vectorSearch(queryEmbedding, this.chunks, topK);
    const codeResults = this.codeBM25.search(query, topK);
    const textResults = this.textBM25.search(query, topK);

    // Merge with RRF
    const hybridResults = reciprocalRankFusion(
      [vectorResults, codeResults, textResults],
      topK
    );

    return hybridResults;
  }

  /**
   * Search with individual methods for comparison
   */
  async searchWithBreakdown(
    query: string,
    queryEmbedding: number[],
    topK = 100
  ): Promise<{
    vector: SearchResult[];
    bm25Code: SearchResult[];
    bm25Text: SearchResult[];
    hybrid: SearchResult[];
  }> {
    const vector = vectorSearch(queryEmbedding, this.chunks, topK);
    const bm25Code = this.codeBM25.search(query, topK);
    const bm25Text = this.textBM25.search(query, topK);
    const hybrid = reciprocalRankFusion([vector, bm25Code, bm25Text], topK);

    return {
      vector,
      bm25Code,
      bm25Text,
      hybrid,
    };
  }

  /**
   * Get statistics about the index
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      withEmbeddings: this.chunks.filter(c => c.embedding).length,
      codeBM25: this.codeBM25.getStats(),
      textBM25: this.textBM25.getStats(),
    };
  }
}
