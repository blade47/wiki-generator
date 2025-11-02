/**
 * Step: Find Relevant Code for Feature using HyDE + RAG
 */

import { hydeAgent } from '@/lib/agents/hyde';
import { generateEmbedding } from '@/lib/rag/embedder';
import { BM25Index } from '@/lib/rag/bm25';
import { HybridSearch } from '@/lib/rag/hybrid-search';
import { rerankResults } from '@/lib/rag/reranking';
import type { CodeChunk, RAGIndexState } from '@/lib/rag/types';
import type { FeaturesOutput } from '@/lib/agents/features';
import type { ReconOutput } from '@/lib/agents/recon';

interface FindRelevantCodeInput {
  feature: FeaturesOutput['features'][0];
  repoName: string;
  repoOverview: string;
  techStack: ReconOutput['techStack'];
  indexState: RAGIndexState;
}

export async function findRelevantCode(input: FindRelevantCodeInput): Promise<CodeChunk[]> {
  'use step';

  const { feature, repoName, repoOverview, techStack, indexState } = input;

  console.log(`[Step] Finding relevant code for: ${feature.name}`);

  // Rebuild search infrastructure from serialized state (fast!)
  const codeBM25 = BM25Index.fromState(indexState.codeBM25, indexState.chunks);
  const textBM25 = BM25Index.fromState(indexState.textBM25, indexState.chunks);
  const hybridSearch = new HybridSearch(indexState.chunks, codeBM25, textBM25);

  // Use HyDE to expand the feature query
  const hydeResult = await hydeAgent.execute({
    query: `${feature.name}: ${feature.description}`,
    repoContext: {
      name: repoName,
      overview: repoOverview,
      techStack: [
        ...techStack.languages,
        ...techStack.frameworks,
        ...techStack.tools,
      ],
    },
  });

  // Search for relevant code using expanded queries
  const queries = [
    feature.name,
    ...hydeResult.expandedQueries.slice(0, 3),
  ];

  // Combine search results from all queries
  const allResults = new Map<string, CodeChunk>();

  for (const query of queries) {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Run hybrid search
    const hybridResults = await hybridSearch.search(query, queryEmbedding, 100);

    // Run 3-stage reranking
    const { stage3 } = await rerankResults(query, queryEmbedding, hybridResults, {
      stage2TopK: 30,
      stage3TopK: 10,
    });

    // Add top results to map
    stage3.slice(0, 5).forEach(r => {
      allResults.set(r.chunk.id, r.chunk);
    });
  }

  const relevantChunks = Array.from(allResults.values()).slice(0, 10);

  console.log(`[Step] ✓ Found ${relevantChunks.length} relevant code chunks`);
  return relevantChunks;
}
