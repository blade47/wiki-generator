/**
 * 3-Stage Reranking Pipeline
 *
 * Stage 1: Hybrid search (Vector + BM25-Code + BM25-Text) → 100 candidates
 * Stage 2: Embedding similarity rerank → 30 candidates
 * Stage 3: LLM Code Ranker → 10 final results
 */

import type { CodeChunk } from './types';
import type { SearchResult } from './hybrid-search';
import { cosineSimilarity } from './hybrid-search';
import { codeRankerAgent } from '@/lib/agents/code-ranker';

/**
 * Stage 2: Rerank by embedding similarity
 */
export function rerankByEmbedding(
  queryEmbedding: number[],
  candidates: SearchResult[],
  topK = 30
): SearchResult[] {
  // Calculate cosine similarity for each candidate
  const scored = candidates
    .filter(result => result.chunk.embedding)
    .map(result => ({
      chunk: result.chunk,
      score: cosineSimilarity(queryEmbedding, result.chunk.embedding!),
    }));

  // Sort by similarity (descending) and return top-k
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Stage 3: Rerank by LLM scoring
 */
export async function rerankByLLM(
  query: string,
  candidates: SearchResult[],
  topK = 10
): Promise<SearchResult[]> {
  console.log(`Reranking ${candidates.length} candidates with LLM...`);

  // Score each candidate with LLM
  const scored = await Promise.all(
    candidates.map(async result => {
      try {
        const ranking = await codeRankerAgent.execute({
          query,
          chunk: result.chunk,
        });

        return {
          chunk: result.chunk,
          score: ranking.score,
          explanation: ranking.explanation,
        };
      } catch (error) {
        console.error(`Failed to rank chunk ${result.chunk.id}:`, error);
        return {
          chunk: result.chunk,
          score: 0,
          explanation: 'Ranking failed',
        };
      }
    })
  );

  // Sort by LLM score (descending) and return top-k
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Full 3-stage reranking pipeline
 */
export async function rerankResults(
  query: string,
  queryEmbedding: number[],
  hybridResults: SearchResult[],
  config = {
    stage2TopK: 30,
    stage3TopK: 10,
  }
): Promise<{
  stage1: SearchResult[];
  stage2: SearchResult[];
  stage3: SearchResult[];
}> {
  console.log('\n=== 3-Stage Reranking Pipeline ===');

  // Stage 1: Hybrid search results (already done, passed in)
  const stage1 = hybridResults;
  console.log(`Stage 1 (Hybrid): ${stage1.length} candidates`);

  // Stage 2: Embedding similarity rerank
  const stage2 = rerankByEmbedding(queryEmbedding, stage1, config.stage2TopK);
  console.log(`Stage 2 (Embedding rerank): ${stage2.length} candidates`);

  // Stage 3: LLM rerank
  const stage3 = await rerankByLLM(query, stage2, config.stage3TopK);
  console.log(`Stage 3 (LLM rerank): ${stage3.length} final results\n`);

  return { stage1, stage2, stage3 };
}

/**
 * Reranking statistics
 */
export function analyzeReranking(
  stage1: SearchResult[],
  stage2: SearchResult[],
  stage3: SearchResult[]
): {
  stage1Count: number;
  stage2Count: number;
  stage3Count: number;
  stage2Overlap: number;
  stage3Overlap: number;
  finalTopChunk: CodeChunk;
} {
  const stage1Ids = new Set(stage1.map(r => r.chunk.id));
  const stage2Ids = new Set(stage2.map(r => r.chunk.id));

  // Calculate how many from stage1 made it to stage2
  const stage2Overlap = stage2.filter(r => stage1Ids.has(r.chunk.id)).length;

  // Calculate how many from stage2 made it to stage3
  const stage3Overlap = stage3.filter(r => stage2Ids.has(r.chunk.id)).length;

  return {
    stage1Count: stage1.length,
    stage2Count: stage2.length,
    stage3Count: stage3.length,
    stage2Overlap,
    stage3Overlap,
    finalTopChunk: stage3[0].chunk,
  };
}
