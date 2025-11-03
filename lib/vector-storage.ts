/**
 * Upstash Vector Storage Layer
 *
 * Stores code chunk embeddings in Upstash Vector for semantic search
 */

import { Index } from '@upstash/vector';
import type { CodeChunk, ChunkType } from '@/lib/rag/types';

/**
 * Initialize Upstash Vector client
 */
function getVectorIndex() {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN environment variables');
  }

  return new Index({
    url,
    token,
  });
}

/**
 * Save code chunks with embeddings to Upstash Vector
 */
export async function saveChunksToVector(
  repoName: string,
  repoSlug: string,
  repoUrl: string,
  defaultBranch: string,
  chunks: CodeChunk[]
): Promise<void> {
  console.log(`[Vector Storage] Saving ${chunks.length} chunks to Upstash Vector...`);

  const index = getVectorIndex();

  // Filter chunks that have embeddings
  const chunksWithEmbeddings = chunks.filter(chunk => chunk.embedding && chunk.embedding.length > 0);

  if (chunksWithEmbeddings.length === 0) {
    console.warn('[Vector Storage] No chunks with embeddings found');
    return;
  }

  console.log(`[Vector Storage] Found ${chunksWithEmbeddings.length} chunks with embeddings`);

  // Prepare vectors for upsert
  // IMPORTANT: Upstash has 48KB metadata limit, so we only store essentials
  const vectors = chunksWithEmbeddings.map(chunk => {
    // Create a preview snippet (max 500 chars to stay under metadata limit)
    const snippet = chunk.code.slice(0, 500);

    return {
      id: `${repoSlug}:${chunk.id}`, // Prefix with repo for namespacing
      vector: chunk.embedding!,
      metadata: {
        // Essential fields for search and display
        repoName,
        repoSlug,
        repoUrl,
        defaultBranch,
        filePath: chunk.filePath,
        chunkId: chunk.id,
        type: chunk.type,
        name: chunk.name,
        language: chunk.language,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        snippet, // Preview only (not full code)
      },
    };
  });

  // Upsert in batches (Upstash recommends batches of 1000)
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(vectors.length / BATCH_SIZE);

    console.log(`[Vector Storage] Upserting batch ${batchNumber}/${totalBatches} (${batch.length} vectors)...`);

    try {
      await index.upsert(batch);
      inserted += batch.length;
      console.log(`[Vector Storage] ✓ Batch ${batchNumber}/${totalBatches} complete`);
    } catch (error) {
      console.error(`[Vector Storage] ❌ Failed batch ${batchNumber}/${totalBatches}:`, error);

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.error(`[Vector Storage] Rate limit hit. Consider adding delays between batches.`);
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          console.error(`[Vector Storage] Payload too large. Batch size: ${batch.length} vectors`);
        }
      }

      // Re-throw to let caller handle
      throw error;
    }
  }

  console.log(`[Vector Storage] ✓ Saved ${inserted} vectors to Upstash for ${repoName}`);
}

/**
 * Search for similar code chunks
 */
export async function searchSimilarCode(
  query: string,
  queryEmbedding: number[],
  repoSlug?: string,
  topK: number = 10
): Promise<Array<{ chunk: CodeChunk; score: number; repoUrl: string; defaultBranch: string }>> {
  const index = getVectorIndex();

  console.log(`[Vector Storage] Searching for: "${query}"${repoSlug ? ` in repo: ${repoSlug}` : ''}`);

  // Build filter for repo if specified
  const filter = repoSlug ? `repoSlug = '${repoSlug}'` : undefined;

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter,
  });

  console.log(`[Vector Storage] Found ${results.length} results`);

  return results
    .filter(result => result.metadata) // Filter out results without metadata
    .map(result => {
      const metadata = result.metadata!;

      // Reconstruct minimal CodeChunk from stored metadata
      // Note: We only store essentials to stay under Upstash's 48KB metadata limit
      return {
        chunk: {
          id: (metadata.chunkId as string) || '',
          filePath: (metadata.filePath as string) || '',
          type: (metadata.type as ChunkType) || 'function',
          name: (metadata.name as string) || 'Unknown',
          language: (metadata.language as string) || 'text',
          startLine: (metadata.startLine as number) || 0,
          endLine: (metadata.endLine as number) || 0,
          code: (metadata.snippet as string) || '', // Fallback for old vectors without snippet
          context: {
            imports: [],
            exports: [],
            calls: [],
            dependencies: [],
          },
          keywords: [],
          embedding: result.vector,
        },
        score: result.score,
        repoUrl: (metadata.repoUrl as string) || '',
        defaultBranch: (metadata.defaultBranch as string) || 'main',
      };
    });
}
