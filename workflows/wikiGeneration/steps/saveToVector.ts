/**
 * Step: Save embeddings to Upstash Vector
 */

import { saveChunksToVector } from '@/lib/vector-storage';
import type { RAGIndexState } from '@/lib/rag/types';

export async function saveToVector(
  repoName: string,
  repoSlug: string,
  repoUrl: string,
  defaultBranch: string,
  indexState: RAGIndexState
): Promise<void> {
  'use step';

  console.log(`[Step] Saving ${indexState.chunks.length} chunks to Upstash Vector`);

  await saveChunksToVector(repoName, repoSlug, repoUrl, defaultBranch, indexState.chunks);

  console.log(`[Step] ✓ Saved embeddings to Upstash Vector for ${repoName}`);
}
