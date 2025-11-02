/**
 * Embeddings System - Generate vector embeddings for code chunks
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 * Batches requests for efficiency (100 chunks at a time)
 */

import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import type { CodeChunk } from './types';

/**
 * Embedding model configuration
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const BATCH_SIZE = 50; // Reduced from 100 to avoid 8192 token limit
export const PARALLEL_BATCHES = 10; // Process 10 batches concurrently (increased from 3 for speed)

/**
 * Maximum code size for embeddings (to avoid token limits)
 * ~10KB ≈ 2500 tokens, leaving room for metadata
 */
const MAX_EMBEDDING_CODE_SIZE = 10000;

/**
 * Create rich embedding text from a chunk
 * Combines file path, type, name, JSDoc, and code for better semantic understanding
 */
export function createEmbeddingText(chunk: CodeChunk): string {
  const parts: string[] = [];

  // File context
  parts.push(`File: ${chunk.filePath}`);

  // Chunk metadata
  parts.push(`Type: ${chunk.type}`);
  parts.push(`Name: ${chunk.name}`);

  // Language
  parts.push(`Language: ${chunk.language}`);

  // Documentation (if available)
  if (chunk.context.jsDoc) {
    parts.push(`Documentation: ${chunk.context.jsDoc}`);
  }

  // Parent class context (for methods)
  if (chunk.context.parentClass) {
    parts.push(`Class: ${chunk.context.parentClass}`);
  }

  // The actual code (truncated if too large)
  let code = chunk.code;
  if (code.length > MAX_EMBEDDING_CODE_SIZE) {
    code = code.slice(0, MAX_EMBEDDING_CODE_SIZE);
    parts.push(`Code (truncated to ${MAX_EMBEDDING_CODE_SIZE} chars):\n${code}...`);
  } else {
    parts.push(`Code:\n${code}`);
  }

  return parts.join('\n\n');
}

/**
 * Generate embedding for a single chunk
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });

  return embedding;
}

/**
 * Generate embeddings for a single chunk (with rich text)
 */
export async function embedChunk(chunk: CodeChunk): Promise<CodeChunk> {
  const embeddingText = createEmbeddingText(chunk);
  const embedding = await generateEmbedding(embeddingText);

  return {
    ...chunk,
    embedding,
  };
}

/**
 * Generate embeddings for multiple chunks in batches
 * This is the main function to use for efficiency
 */
export async function embedChunks(chunks: CodeChunk[]): Promise<CodeChunk[]> {
  const totalChunks = chunks.length;
  const chunksWithEmbeddings = [...chunks];
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

  console.log(`Generating embeddings for ${totalChunks} chunks (${totalBatches} batches, ${PARALLEL_BATCHES} concurrent)...`);

  // Create batch tasks
  const batchTasks: Array<{
    batch: CodeChunk[];
    batchNumber: number;
    startIndex: number;
  }> = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    batchTasks.push({ batch, batchNumber, startIndex: i });
  }

  // Process batches with controlled parallelism
  const results: Array<{ embeddings: number[][]; startIndex: number }> = [];

  for (let i = 0; i < batchTasks.length; i += PARALLEL_BATCHES) {
    const parallelTasks = batchTasks.slice(i, i + PARALLEL_BATCHES);

    const parallelResults = await Promise.all(
      parallelTasks.map(async ({ batch, batchNumber, startIndex }) => {
        try {
          console.log(`  Batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

          // Create embedding texts for this batch
          const embeddingTexts = batch.map(createEmbeddingText);

          // Generate embeddings
          const { embeddings } = await embedMany({
            model: openai.embedding(EMBEDDING_MODEL),
            values: embeddingTexts,
          });

          console.log(`    ✓ Embedded batch ${batchNumber}`);

          return { embeddings, startIndex };
        } catch (error) {
          console.error(`    ✗ Failed to embed batch ${batchNumber}:`, error);
          throw error;
        }
      })
    );

    results.push(...parallelResults);
  }

  // Attach embeddings to chunks
  results.forEach(({ embeddings, startIndex }) => {
    embeddings.forEach((embedding, idx) => {
      const chunkIndex = startIndex + idx;
      chunksWithEmbeddings[chunkIndex] = {
        ...chunksWithEmbeddings[chunkIndex],
        embedding,
      };
    });
  });

  console.log(`✓ Successfully embedded ${totalChunks} chunks`);

  return chunksWithEmbeddings;
}

/**
 * Verify embeddings are valid
 */
export function validateEmbeddings(chunks: CodeChunk[]): {
  valid: boolean;
  stats: {
    total: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
    invalidDimensions: number;
  };
} {
  const stats = {
    total: chunks.length,
    withEmbeddings: 0,
    withoutEmbeddings: 0,
    invalidDimensions: 0,
  };

  for (const chunk of chunks) {
    if (chunk.embedding) {
      stats.withEmbeddings++;

      if (chunk.embedding.length !== EMBEDDING_DIMENSIONS) {
        stats.invalidDimensions++;
      }
    } else {
      stats.withoutEmbeddings++;
    }
  }

  const valid =
    stats.withEmbeddings === stats.total && stats.invalidDimensions === 0;

  return { valid, stats };
}
