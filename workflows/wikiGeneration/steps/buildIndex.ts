/**
 * Step: Build RAG Index and Return Serializable State
 */

import { RAGIndex, type IndexFile } from '@/lib/rag';
import type { RAGIndexState } from '@/lib/rag/types';

export async function buildIndex(files: IndexFile[]): Promise<RAGIndexState> {
  'use step';

  console.log(`[Step] Building RAG index from ${files.length} files`);

  const index = new RAGIndex({
    enableCompression: true,
    compressionThreshold: 2000,
  });

  await index.build(files);

  const chunks = index.getChunks();
  const codeBM25 = index.getCodeBM25();
  const textBM25 = index.getTextBM25();

  console.log(`[Step] ✓ Built RAG index with ${chunks.length} chunks`);
  console.log(`[Step] ✓ Serializing index state for workflow`);

  return {
    chunks,
    codeBM25: codeBM25.toState(),
    textBM25: textBM25.toState(),
  };
}
