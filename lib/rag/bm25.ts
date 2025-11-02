/**
 * BM25 (Best Matching 25) - Keyword-based ranking algorithm
 *
 * Used for hybrid search alongside vector embeddings
 * Dual approach:
 * - BM25-Code: Search over actual code
 * - BM25-Text: Search over metadata (file, type, name, docs)
 */

import type { CodeChunk, BM25State } from './types';

/**
 * BM25 parameters (standard values)
 */
export const BM25_K1 = 1.2; // Term frequency saturation
export const BM25_B = 0.75; // Length normalization

/**
 * Tokenize text into terms (lowercase, alphanumeric)
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(term => term.length > 0);
}

/**
 * Calculate IDF (Inverse Document Frequency) for all terms
 */
export function calculateIDF(
  documents: string[][],
  totalDocs: number
): Map<string, number> {
  const idf = new Map<string, number>();
  const documentFrequency = new Map<string, number>();

  // Count document frequency for each term
  for (const doc of documents) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  // Calculate IDF: log((N - df + 0.5) / (df + 0.5) + 1)
  for (const [term, df] of documentFrequency) {
    const idfScore = Math.log((totalDocs - df + 0.5) / (df + 0.5) + 1);
    idf.set(term, idfScore);
  }

  return idf;
}

/**
 * Calculate BM25 score for a single document
 */
export function calculateBM25Score(
  queryTerms: string[],
  docTerms: string[],
  idf: Map<string, number>,
  avgDocLength: number,
  k1 = BM25_K1,
  b = BM25_B
): number {
  let score = 0;
  const docLength = docTerms.length;

  // Count term frequencies in document
  const termFreq = new Map<string, number>();
  for (const term of docTerms) {
    termFreq.set(term, (termFreq.get(term) || 0) + 1);
  }

  // Calculate BM25 score
  for (const term of queryTerms) {
    const tf = termFreq.get(term) || 0;
    if (tf === 0) continue;

    const idfScore = idf.get(term) || 0;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

    score += idfScore * (numerator / denominator);
  }

  return score;
}

/**
 * BM25 Index for efficient searching
 */
export class BM25Index {
  private documents: string[][] = [];
  private chunks: CodeChunk[] = [];
  private idf: Map<string, number> = new Map();
  private avgDocLength = 0;

  constructor(
    private readonly getDocumentText: (chunk: CodeChunk) => string,
    private readonly name: string,
    private readonly indexType: 'code' | 'text'
  ) {}

  /**
   * Build the index from chunks
   */
  build(chunks: CodeChunk[]): void {
    this.chunks = chunks;
    this.documents = chunks.map(chunk => {
      const text = this.getDocumentText(chunk);
      return tokenize(text);
    });

    // Calculate average document length
    const totalLength = this.documents.reduce(
      (sum, doc) => sum + doc.length,
      0
    );
    this.avgDocLength = totalLength / this.documents.length;

    // Calculate IDF for all terms
    this.idf = calculateIDF(this.documents, this.documents.length);

    console.log(`Built ${this.name} index:`);
    console.log(`  Documents: ${this.documents.length}`);
    console.log(`  Average doc length: ${this.avgDocLength.toFixed(1)} terms`);
    console.log(`  Unique terms: ${this.idf.size}`);
  }

  /**
   * Search for top-k results
   */
  search(query: string, topK = 100): Array<{ chunk: CodeChunk; score: number }> {
    const queryTerms = tokenize(query);

    // Calculate scores for all documents
    const scores = this.documents.map((docTerms, idx) => ({
      chunk: this.chunks[idx],
      score: calculateBM25Score(
        queryTerms,
        docTerms,
        this.idf,
        this.avgDocLength
      ),
    }));

    // Sort by score (descending) and return top-k
    return scores
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get statistics about the index
   */
  getStats() {
    return {
      name: this.name,
      documents: this.documents.length,
      avgDocLength: this.avgDocLength,
      uniqueTerms: this.idf.size,
    };
  }

  /**
   * Serialize to state (for Vercel Workflow)
   */
  toState(): BM25State {
    return {
      documents: this.documents,
      idf: this.idf,
      avgDocLength: this.avgDocLength,
      type: this.indexType,
      name: this.name,
    };
  }

  /**
   * Rebuild from state (for Vercel Workflow)
   */
  static fromState(state: BM25State, chunks: CodeChunk[]): BM25Index {
    // Validate state matches chunks
    if (state.documents.length !== chunks.length) {
      throw new Error(
        `State/chunks length mismatch: state has ${state.documents.length} documents, ` +
        `but received ${chunks.length} chunks`
      );
    }

    const getDocumentText = state.type === 'code'
      ? (chunk: CodeChunk) => chunk.code
      : (chunk: CodeChunk) => {
          const parts: string[] = [];
          parts.push(chunk.filePath);
          parts.push(chunk.type);
          parts.push(chunk.name);
          parts.push(chunk.language);
          if (chunk.context.jsDoc) parts.push(chunk.context.jsDoc);
          if (chunk.context.parentClass) parts.push(chunk.context.parentClass);
          parts.push(...chunk.keywords);
          return parts.join(' ');
        };

    const index = new BM25Index(getDocumentText, state.name, state.type);
    index.documents = state.documents;
    index.chunks = chunks;
    index.idf = state.idf;
    index.avgDocLength = state.avgDocLength;

    return index;
  }
}

/**
 * Create BM25-Code index (searches actual code)
 */
export function createCodeBM25(chunks: CodeChunk[]): BM25Index {
  const index = new BM25Index(chunk => chunk.code, 'BM25-Code', 'code');
  index.build(chunks);
  return index;
}

/**
 * Create BM25-Text index (searches metadata: file, type, name, docs)
 */
export function createTextBM25(chunks: CodeChunk[]): BM25Index {
  const index = new BM25Index(chunk => {
    const parts: string[] = [];
    parts.push(chunk.filePath);
    parts.push(chunk.type);
    parts.push(chunk.name);
    parts.push(chunk.language);
    if (chunk.context.jsDoc) {
      parts.push(chunk.context.jsDoc);
    }
    if (chunk.context.parentClass) {
      parts.push(chunk.context.parentClass);
    }
    parts.push(...chunk.keywords);
    return parts.join(' ');
  }, 'BM25-Text', 'text');
  index.build(chunks);
  return index;
}
