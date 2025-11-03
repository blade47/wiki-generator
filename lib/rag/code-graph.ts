/**
 * Code Graph - Knowledge Graph for Code Relationships
 *
 * Builds a graph from code chunks to discover relationships and flows
 */

import type { CodeChunk } from './types';

/**
 * Simple code graph for discovering related chunks
 */
export class CodeGraph {
  // Map: chunk.id → function names it calls
  private callEdges: Map<string, string[]> = new Map();

  // Map: function name → chunk IDs that define it
  private definitions: Map<string, string[]> = new Map();

  // All chunks by ID for quick lookup
  private chunksById: Map<string, CodeChunk> = new Map();

  constructor(chunks: CodeChunk[]) {
    this.buildGraph(chunks);
  }

  /**
   * Build graph from chunks
   */
  private buildGraph(chunks: CodeChunk[]): void {
    // Index chunks by ID
    for (const chunk of chunks) {
      this.chunksById.set(chunk.id, chunk);

      // Store what this chunk calls
      if (chunk.context.calls.length > 0) {
        this.callEdges.set(chunk.id, chunk.context.calls);
      }

      // Index this chunk as defining its name
      if (!this.definitions.has(chunk.name)) {
        this.definitions.set(chunk.name, []);
      }
      this.definitions.get(chunk.name)!.push(chunk.id);
    }
  }

  /**
   * Find all chunks related to the given chunk (up to N hops away)
   *
   * @param chunkId - Starting chunk ID
   * @param maxDepth - Maximum hops to traverse (default: 3)
   * @returns Array of related chunks, sorted by relevance
   */
  findRelated(chunkId: string, maxDepth: number = 3): CodeChunk[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [];
    const related: Array<{ chunk: CodeChunk; depth: number }> = [];

    // Start BFS from the given chunk
    queue.push({ id: chunkId, depth: 0 });
    visited.add(chunkId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Get current chunk
      const chunk = this.chunksById.get(current.id);
      if (!chunk) continue;

      // Add to results (except the starting chunk)
      if (current.depth > 0) {
        related.push({ chunk, depth: current.depth });
      }

      // Don't traverse beyond max depth
      if (current.depth >= maxDepth) continue;

      // Follow calls: chunk → functions it calls → chunks that define those functions
      const calls = this.callEdges.get(current.id) || [];
      for (const functionName of calls) {
        const definingChunks = this.definitions.get(functionName) || [];
        for (const targetId of definingChunks) {
          if (!visited.has(targetId)) {
            visited.add(targetId);
            queue.push({ id: targetId, depth: current.depth + 1 });
          }
        }
      }
    }

    // Sort by depth (closer = more relevant)
    related.sort((a, b) => a.depth - b.depth);

    return related.map(r => r.chunk);
  }

  /**
   * Find chunks that call the given function name
   *
   * @param functionName - Function name to search for
   * @returns Chunks that call this function
   */
  findCallers(functionName: string): CodeChunk[] {
    const callers: CodeChunk[] = [];

    for (const [chunkId, calls] of this.callEdges.entries()) {
      if (calls.includes(functionName)) {
        const chunk = this.chunksById.get(chunkId);
        if (chunk) callers.push(chunk);
      }
    }

    return callers;
  }

  /**
   * Find chunks that define the given function name
   *
   * @param functionName - Function name to search for
   * @returns Chunks that define this function
   */
  findDefinitions(functionName: string): CodeChunk[] {
    const chunkIds = this.definitions.get(functionName) || [];
    return chunkIds
      .map(id => this.chunksById.get(id))
      .filter((chunk): chunk is CodeChunk => chunk !== undefined);
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      totalChunks: this.chunksById.size,
      chunksWithCalls: this.callEdges.size,
      uniqueFunctionNames: this.definitions.size,
      totalCallEdges: Array.from(this.callEdges.values()).reduce(
        (sum, calls) => sum + calls.length,
        0
      ),
    };
  }
}
