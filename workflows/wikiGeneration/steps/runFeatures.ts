/**
 * Step: Run Features Agent (with Knowledge Graph)
 */

import { featuresAgent, type FeaturesOutput } from '@/lib/agents/features';
import { CodeGraph } from '@/lib/rag';
import type { RepoData } from '@/lib/github/fetcher';
import type { ReconOutput } from '@/lib/agents/recon';
import type { CodeChunk } from '@/lib/rag/types';

export async function runFeatures(
  repoData: RepoData,
  recon: ReconOutput,
  chunks: CodeChunk[]
): Promise<FeaturesOutput> {
  'use step';

  console.log(`[Step] Running Features Agent (with Knowledge Graph)`);
  console.log(`[Step] Total chunks: ${chunks.length}`);

  // Build knowledge graph from chunks
  console.log(`[Step] Building code graph...`);
  const graph = new CodeGraph(chunks);
  const stats = graph.getStats();
  console.log(`[Step] Graph: ${stats.chunksWithCalls} chunks with calls, ${stats.totalCallEdges} edges`);

  // Find entry points: exported functions, classes, routes
  const entryPoints = chunks.filter(chunk =>
    // Exported functions/classes (likely public API)
    chunk.context.exports.length > 0 ||
    // Route handlers (Express, Next.js, etc.)
    chunk.filePath.includes('route') ||
    chunk.filePath.includes('api') ||
    chunk.filePath.includes('handler') ||
    chunk.filePath.includes('controller') ||
    // Main/index files (check file name, not chunk name)
    chunk.filePath.endsWith('main.ts') ||
    chunk.filePath.endsWith('main.js') ||
    chunk.filePath.endsWith('index.ts') ||
    chunk.filePath.endsWith('index.js') ||
    // Functions/classes that have many calls (likely important)
    chunk.context.calls.length >= 3
  );

  console.log(`[Step] Found ${entryPoints.length} entry points`);

  let selectedChunks: CodeChunk[];

  // If we found entry points, use knowledge graph to get connected code
  if (entryPoints.length > 0) {
    const connectedChunks = new Map<string, CodeChunk>();

    for (const entryPoint of entryPoints.slice(0, 20)) { // Limit to 20 entry points
      // Add the entry point itself
      connectedChunks.set(entryPoint.id, entryPoint);

      // Find related chunks (2 hops deep)
      const related = graph.findRelated(entryPoint.id, 2);
      for (const chunk of related) {
        connectedChunks.set(chunk.id, chunk);
      }
    }

    // Convert to array and limit to 50 chunks
    selectedChunks = Array.from(connectedChunks.values()).slice(0, 50);
    console.log(`[Step] Selected ${selectedChunks.length} connected chunks (from ${entryPoints.length} entry points)`);
  } else {
    // Fallback: No entry points found, use top prioritized chunks
    console.log(`[Step] No entry points found, falling back to top 50 prioritized chunks`);
    selectedChunks = chunks.slice(0, 50);
  }

  const features = await featuresAgent.execute({
    repoName: repoData.name,
    overview: recon.overview,
    readme: repoData.readme,
    codeChunks: selectedChunks,
  });

  console.log(`[Step] ✓ Detected ${features.features.length} features`);
  return features;
}
