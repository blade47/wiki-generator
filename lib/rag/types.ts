/**
 * RAG System Type Definitions
 */

export type ChunkType =
  | 'function'
  | 'method'
  | 'class'
  | 'component'
  | 'interface'
  | 'constant'
  | 'readme'        // README.md full file
  | 'documentation' // Other .md files (split by sections)
  | 'metadata';     // package.json, Cargo.toml, etc.

export interface CodeChunk {
  // Identity
  id: string; // Unique ID: `${repoUrl}:${filePath}:${startLine}`

  // Location
  filePath: string; // Path in repo
  startLine: number; // Start line (1-indexed)
  endLine: number; // End line (1-indexed)

  // Metadata
  type: ChunkType; // Type of code chunk
  name: string; // Function/class name
  language: string; // 'javascript', 'python', etc.

  // Code
  code: string; // Full code of the chunk
  signature?: string; // Function signature only (for methods)

  // Context
  context: {
    imports: string[]; // Relevant imports used by this chunk
    exports: string[]; // What this chunk exports
    parentClass?: string; // If method, parent class name
    jsDoc?: string; // JSDoc/docstring comments
    dependencies: string[]; // Other chunks this depends on
  };

  // Search (populated later)
  embedding?: number[]; // Vector embedding (1536-dim)
  keywords: string[]; // Keywords for BM25 search

  // Compression metadata (if compressed)
  compressed?: boolean;
  originalSize?: number;
}

export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  method: 'bm25' | 'vector' | 'hybrid';
}

export interface RankedChunk {
  chunk: CodeChunk;
  score: number;
  stage: 'embedding-rerank' | 'llm-rubric';
}

export interface FinalRankedChunk extends RankedChunk {
  embeddingScore: number;
  rubricScore: number;
  finalScore: number;
  rubric?: {
    relevance: number;
    completeness: number;
    clarity: number;
    documentation: number;
    explanation: string;
  };
}

export type Language =
  | 'javascript'
  | 'typescript'
  | 'tsx'
  | 'python'
  | 'go'
  | 'rust';
