/**
 * RAG Index - Simplified Pipeline
 *
 * Builds RAG index for the workflow:
 * - Chunking (code + non-code)
 * - Code compression (optional)
 * - Embeddings (batch)
 */

import type { CodeChunk } from './types';
import { chunkFile } from './chunker';
import { embedChunks } from './embedder';
import { codeSummarizerAgent } from '@/lib/agents/code-summarizer';

// Export CodeGraph for knowledge graph features
export { CodeGraph } from './code-graph';

/**
 * File to index
 */
export interface IndexFile {
  path: string;
  content: string;
}

/**
 * RAG Index configuration
 */
export interface RAGIndexConfig {
  /**
   * Enable code compression for large chunks
   */
  enableCompression?: boolean;

  /**
   * Compression threshold (chars)
   */
  compressionThreshold?: number;
}

/**
 * Internal configuration type (fully required)
 */
interface InternalConfig {
  enableCompression: boolean;
  compressionThreshold: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: InternalConfig = {
  enableCompression: true,
  compressionThreshold: 2000, // Only compress chunks larger than 2KB (genuinely large chunks)
};

/**
 * RAG Index - Main interface
 */
export class RAGIndex {
  private chunks: CodeChunk[] = [];
  private config: InternalConfig;

  constructor(config: RAGIndexConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Build index from files
   */
  async build(files: IndexFile[], maxChunksToEmbed?: number): Promise<void> {
    console.log('\n=== Building RAG Index ===\n');

    // 1. Chunk all files
    console.log('Step 1: Chunking files...');
    const allChunks = files.flatMap(file => chunkFile(file.path, file.content));
    console.log(`  ✓ Extracted ${allChunks.length} chunks\n`);

    // 2. Compress large chunks (optional)
    if (this.config.enableCompression) {
      console.log('Step 2: Compressing large chunks...');
      const compressed = await this.compressChunks(allChunks);
      console.log(`  ✓ Compressed ${compressed} large chunks\n`);
    } else {
      console.log('Step 2: Skipping compression (disabled)\n');
    }

    // 3. Prioritize and limit chunks if needed (BEFORE embedding)
    let chunksToEmbed = allChunks;

    if (maxChunksToEmbed && allChunks.length > maxChunksToEmbed) {
      console.log(`Step 3: Prioritizing chunks (${allChunks.length} → ${maxChunksToEmbed})...`);

      chunksToEmbed = [...allChunks]
        .sort((a, b) => {
          // Priority 1: Type (function > class > method > constant)
          const typeScore = (type: string) => {
            if (type === 'function') return 4;
            if (type === 'class') return 3;
            if (type === 'method') return 2;
            return 1;
          };
          const typeA = typeScore(a.type);
          const typeB = typeScore(b.type);
          if (typeA !== typeB) return typeB - typeA;

          // Priority 2: Code size (larger = more important)
          return b.code.length - a.code.length;
        })
        .slice(0, maxChunksToEmbed);

      console.log(`  ✓ Limited to ${maxChunksToEmbed} most important chunks (${allChunks.length - maxChunksToEmbed} excluded from embedding)\n`);
    }

    // 4. Generate embeddings (only for selected chunks)
    console.log(`Step ${maxChunksToEmbed ? '4' : '3'}: Generating embeddings for ${chunksToEmbed.length} chunks...`);
    this.chunks = await embedChunks(chunksToEmbed);
    console.log('');

    console.log('=== Index Build Complete ===\n');
    this.printStats();
  }

  /**
   * Compress large chunks with AI (parallel processing)
   */
  private async compressChunks(chunks: CodeChunk[]): Promise<number> {
    const MAX_COMPRESSIBLE_SIZE = 30000; // 30KB - skip compression for extremely large chunks

    // Find chunks that need compression
    const chunksToCompress = chunks.filter(
      chunk =>
        chunk.code.length > this.config.compressionThreshold &&
        chunk.code.length <= MAX_COMPRESSIBLE_SIZE
    );

    // Count skipped chunks
    const tooLarge = chunks.filter(chunk => chunk.code.length > MAX_COMPRESSIBLE_SIZE);
    if (tooLarge.length > 0) {
      console.log(
        `  ⚠️  Skipping ${tooLarge.length} extremely large chunks (>${MAX_COMPRESSIBLE_SIZE} chars)`
      );
    }

    if (chunksToCompress.length === 0) {
      return 0;
    }

    console.log(`  Found ${chunksToCompress.length} chunks to compress (batches of 5)...`);

    // Compress chunks with controlled parallelism (5 at a time)
    const COMPRESSION_BATCH_SIZE = 5;
    const compressionResults: PromiseSettledResult<{
      chunk: CodeChunk;
      result: { compressed: string };
      originalSize: number;
    }>[] = [];

    for (let i = 0; i < chunksToCompress.length; i += COMPRESSION_BATCH_SIZE) {
      const batch = chunksToCompress.slice(i, i + COMPRESSION_BATCH_SIZE);
      const batchNumber = Math.floor(i / COMPRESSION_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunksToCompress.length / COMPRESSION_BATCH_SIZE);

      console.log(`    Compressing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

      const batchResults = await Promise.allSettled(
        batch.map(async (chunk) => {
          const originalSize = chunk.code.length;
          const result = await codeSummarizerAgent.execute({
            chunk,
            targetSize: this.config.compressionThreshold,
          });

          return {
            chunk,
            result,
            originalSize,
          };
        })
      );

      compressionResults.push(...batchResults);
      console.log(`    ✓ Batch ${batchNumber}/${totalBatches} complete`);
    }

    // Process results
    let compressed = 0;
    let originalBytes = 0;
    let compressedBytes = 0;

    compressionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { chunk, result: compressionResult, originalSize } = result.value;

        chunk.code = compressionResult.compressed;
        chunk.compressed = true;
        chunk.originalSize = originalSize;

        originalBytes += originalSize;
        compressedBytes += compressionResult.compressed.length;
        compressed++;
      } else {
        console.warn(`  Failed to compress chunk ${chunksToCompress[index].id}:`, result.reason);
      }
    });

    if (compressed > 0) {
      const savedBytes = originalBytes - compressedBytes;
      const compressionRatio = ((1 - compressedBytes / originalBytes) * 100).toFixed(1);
      console.log(`  ✓ Compression stats: ${savedBytes.toLocaleString()} bytes saved (${compressionRatio}% reduction)`);
    }

    return compressed;
  }

  /**
   * Get all chunks
   */
  getChunks(): CodeChunk[] {
    return this.chunks;
  }

  /**
   * Get statistics
   */
  getStats() {
    const compressed = this.chunks.filter(c => c.compressed).length;

    return {
      totalChunks: this.chunks.length,
      withEmbeddings: this.chunks.filter(c => c.embedding).length,
      compressed,
      compressionRate:
        compressed > 0 ? ((compressed / this.chunks.length) * 100).toFixed(1) : '0',
    };
  }

  /**
   * Print statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('Index Statistics:');
    console.log(`  Total chunks: ${stats.totalChunks}`);
    console.log(`  With embeddings: ${stats.withEmbeddings}`);
    console.log(`  Compressed: ${stats.compressed} (${stats.compressionRate}%)`);
    console.log('');
  }
}
