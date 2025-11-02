/**
 * Step: Build RAG Index and Return Serializable State
 */

import { RAGIndex, type IndexFile } from '@/lib/rag';
import type { RAGIndexState } from '@/lib/rag/types';

export async function buildIndex(files: IndexFile[]): Promise<RAGIndexState> {
  'use step';

  console.log(`[Step] Building RAG index from ${files.length} files`);

  const index = new RAGIndex({
    enableCompression: false, // Disable compression - embeddings truncate to 10KB anyway
  });

  await index.build(files);

  const chunks = index.getChunks();

  console.log(`[Step] ✓ Built RAG index with ${chunks.length} chunks`);
  console.log(`[Step] ✓ Returning chunks with embeddings for workflow`);

  return {
    chunks,
  };
}
