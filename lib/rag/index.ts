/**
 * RAG Index - Complete RAG Pipeline
 *
 * Main interface for the entire RAG system:
 * - Chunking (code + non-code)
 * - Code compression (optional)
 * - Embeddings (batch)
 * - BM25 (dual: code + text)
 * - Hybrid search (Vector + BM25-Code + BM25-Text)
 * - 3-stage reranking (100 → 30 → 10)
 */

import type { CodeChunk } from './types';
import type { SearchResult } from './hybrid-search';
import { chunkFile } from './chunker';
import { embedChunks, generateEmbedding } from './embedder';
import { createCodeBM25, createTextBM25, type BM25Index } from './bm25';
import { HybridSearch } from './hybrid-search';
import { rerankResults } from './reranking';
import { codeSummarizerAgent } from '@/lib/agents/code-summarizer';

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

  /**
   * Reranking configuration
   */
  reranking?: {
    stage1TopK?: number; // Hybrid search
    stage2TopK?: number; // Embedding rerank
    stage3TopK?: number; // LLM rerank
  };
}

/**
 * Internal configuration type (fully required)
 */
interface InternalConfig {
  enableCompression: boolean;
  compressionThreshold: number;
  reranking: {
    stage1TopK: number;
    stage2TopK: number;
    stage3TopK: number;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: InternalConfig = {
  enableCompression: true,
  compressionThreshold: 500,
  reranking: {
    stage1TopK: 100,
    stage2TopK: 30,
    stage3TopK: 10,
  },
};

/**
 * RAG Index - Main interface
 */
export class RAGIndex {
  private chunks: CodeChunk[] = [];
  private codeBM25!: BM25Index;
  private textBM25!: BM25Index;
  private hybridSearch!: HybridSearch;
  private config: InternalConfig;

  constructor(config: RAGIndexConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      reranking: {
        ...DEFAULT_CONFIG.reranking,
        ...config.reranking,
      },
    };
  }

  /**
   * Build index from files
   */
  async build(files: IndexFile[]): Promise<void> {
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

    // 3. Generate embeddings
    console.log('Step 3: Generating embeddings...');
    this.chunks = await embedChunks(allChunks);
    console.log('');

    // 4. Build BM25 indexes
    console.log('Step 4: Building BM25 indexes...');
    this.codeBM25 = createCodeBM25(this.chunks);
    this.textBM25 = createTextBM25(this.chunks);
    console.log('');

    // 5. Create hybrid search
    console.log('Step 5: Creating hybrid search...');
    this.hybridSearch = new HybridSearch(this.chunks, this.codeBM25, this.textBM25);
    console.log('  ✓ Hybrid search ready\n');

    console.log('=== Index Build Complete ===\n');
    this.printStats();
  }

  /**
   * Compress large chunks with AI
   */
  private async compressChunks(chunks: CodeChunk[]): Promise<number> {
    let compressed = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (chunk.code.length > this.config.compressionThreshold) {
        try {
          const result = await codeSummarizerAgent.execute({
            chunk,
            targetSize: this.config.compressionThreshold,
          });

          chunk.code = result.compressed;
          chunk.compressed = true;
          chunk.originalSize = chunk.code.length;
          compressed++;
        } catch (error) {
          console.warn(`  Failed to compress chunk ${chunk.id}:`, error);
        }
      }
    }

    return compressed;
  }

  /**
   * Search with full pipeline
   */
  async search(query: string): Promise<SearchResult[]> {
    if (!this.hybridSearch) {
      throw new Error('Index not built. Call build() first.');
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Run hybrid search
    const hybridResults = await this.hybridSearch.search(
      query,
      queryEmbedding,
      this.config.reranking.stage1TopK
    );

    // Run 3-stage reranking
    const { stage3 } = await rerankResults(
      query,
      queryEmbedding,
      hybridResults,
      {
        stage2TopK: this.config.reranking.stage2TopK,
        stage3TopK: this.config.reranking.stage3TopK,
      }
    );

    return stage3;
  }

  /**
   * Search with detailed breakdown
   */
  async searchWithBreakdown(query: string): Promise<{
    query: string;
    stage1: SearchResult[];
    stage2: SearchResult[];
    stage3: SearchResult[];
  }> {
    if (!this.hybridSearch) {
      throw new Error('Index not built. Call build() first.');
    }

    const queryEmbedding = await generateEmbedding(query);

    const hybridResults = await this.hybridSearch.search(
      query,
      queryEmbedding,
      this.config.reranking.stage1TopK
    );

    const { stage1, stage2, stage3 } = await rerankResults(
      query,
      queryEmbedding,
      hybridResults,
      {
        stage2TopK: this.config.reranking.stage2TopK,
        stage3TopK: this.config.reranking.stage3TopK,
      }
    );

    return { query, stage1, stage2, stage3 };
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
      codeBM25: this.codeBM25?.getStats(),
      textBM25: this.textBM25?.getStats(),
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
