/**
 * Step: Find Relevant Code for Feature using Simple Vector Search
 *
 * Lightweight fallback for when Features Agent doesn't provide relatedChunks
 */

import { generateEmbedding } from '@/lib/rag/embedder';
import { vectorSearch } from '@/lib/rag/vector-search';
import type { CodeChunk, RAGIndexState } from '@/lib/rag/types';
import type { FeaturesOutput } from '@/lib/agents/features';
import type { ReconOutput } from '@/lib/agents/recon';

interface FindRelevantCodeInput {
  feature: FeaturesOutput['features'][0];
  repoName: string;
  repoOverview: string;
  techStack: ReconOutput['techStack'];
  indexState: RAGIndexState;
}

export async function findRelevantCode(input: FindRelevantCodeInput): Promise<CodeChunk[]> {
  'use step';

  const { feature, indexState } = input;

  console.log(`[Step] Finding relevant code for: ${feature.name} (simple vector search)`);

  // Generate embedding for the feature query
  const query = `${feature.name}: ${feature.description}`;
  const queryEmbedding = await generateEmbedding(query);

  // Simple vector search (no HyDE, no reranking as is too expensive and slow)
  const results = vectorSearch(queryEmbedding, indexState.chunks, 10);

  const relevantChunks = results.map(r => r.chunk);

  console.log(`[Step] ✓ Found ${relevantChunks.length} relevant code chunks`);
  return relevantChunks;
}
