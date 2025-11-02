/**
 * Step: Build RAG Index and Save to Vector Storage
 *
 * Returns chunks WITHOUT embeddings to avoid HTTP 413 in production
 */

import { RAGIndex, type IndexFile } from '@/lib/rag';
import type { CodeChunk } from '@/lib/rag/types';
import { saveChunksToVector } from '@/lib/vector-storage';

export async function buildIndex(
  files: IndexFile[],
  repoName: string,
  repoSlug: string,
  repoUrl: string,
  defaultBranch: string
): Promise<{ chunks: CodeChunk[] }> {
  'use step';

  console.log(`[Step] Building RAG index from ${files.length} files`);

  const index = new RAGIndex({
    enableCompression: false, // Disable compression - embeddings truncate to 10KB anyway
  });

  // Only embed top 150 chunks (saves 70% of embedding time and cost)
  // All chunks will still be saved to Vector, but we only embed what agents need
  await index.build(files, 150);

  const chunksWithEmbeddings = index.getChunks();

  console.log(`[Step] ✓ Built RAG index with ${chunksWithEmbeddings.length} chunks (prioritized)`);

  // Save to Upstash Vector immediately (while we have embeddings)
  // Non-blocking: If this fails (rate limits, etc.), continue anyway
  console.log(`[Step] Saving ${chunksWithEmbeddings.length} chunks to Upstash Vector...`);
  try {
    await saveChunksToVector(repoName, repoSlug, repoUrl, defaultBranch, chunksWithEmbeddings);
    console.log(`[Step] ✓ Saved embeddings to Upstash Vector`);
  } catch (error) {
    console.error(`[Step] ⚠️ Failed to save to Upstash Vector (continuing anyway):`, error);
    console.error(`[Step] Search will not be available for this wiki, but wiki generation will continue`);
    // Continue workflow - search is optional, wiki generation is essential
  }

  // Strip embeddings AND truncate code for workflow
  // Embeddings: 12KB each (cause HTTP 413)
  // Code: Can be 50KB+ (exceeds agent context windows)
  const MAX_CODE_SIZE_FOR_AGENTS = 3000; // 3KB per chunk (~750 tokens)

  const chunksForAgents = chunksWithEmbeddings.map(chunk => ({
    ...chunk,
    embedding: undefined, // Remove embedding to reduce payload size
    code: chunk.code.length > MAX_CODE_SIZE_FOR_AGENTS
      ? chunk.code.slice(0, MAX_CODE_SIZE_FOR_AGENTS) + '\n// ... (truncated for agents, full code in search)'
      : chunk.code
  }));

  console.log(`[Step] ✓ Returning ${chunksForAgents.length} chunks (truncated for agents, full code in vector)`);

  return {
    chunks: chunksForAgents,
  };
}
