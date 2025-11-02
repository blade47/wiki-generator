/**
 * Step: Build RAG Index and Return Serializable State
 */

import { RAGIndex, type IndexFile } from '@/lib/rag';
import type { RAGIndexState, CodeChunk } from '@/lib/rag/types';

export async function buildIndex(files: IndexFile[]): Promise<{
  chunks: CodeChunk[];
  chunksWithEmbeddings: CodeChunk[];
}> {
  'use step';

  console.log(`[Step] Building RAG index from ${files.length} files`);

  const index = new RAGIndex({
    enableCompression: false, // Disable compression - embeddings truncate to 10KB anyway
  });

  await index.build(files);

  const chunksWithEmbeddings = index.getChunks();

  console.log(`[Step] ✓ Built RAG index with ${chunksWithEmbeddings.length} chunks`);

  // Strip embeddings to reduce payload size for workflow
  // (Embeddings are 12KB each and cause HTTP 413 in production)
  const chunksWithoutEmbeddings = chunksWithEmbeddings.map(chunk => ({
    ...chunk,
    embedding: undefined, // Remove embedding to reduce size
  }));

  console.log(`[Step] ✓ Returning chunks (with and without embeddings)`);

  return {
    chunks: chunksWithoutEmbeddings, // For workflow (no embeddings)
    chunksWithEmbeddings, // For immediate vector storage
  };
}
