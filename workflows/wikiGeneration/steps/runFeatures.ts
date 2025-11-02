/**
 * Step: Run Features Agent
 */

import { featuresAgent, type FeaturesOutput } from '@/lib/agents/features';
import type { RepoData } from '@/lib/github/fetcher';
import type { ReconOutput } from '@/lib/agents/recon';
import type { CodeChunk } from '@/lib/rag/types';

export async function runFeatures(
  repoData: RepoData,
  recon: ReconOutput,
  chunks: CodeChunk[]
): Promise<FeaturesOutput> {
  'use step';

  console.log(`[Step] Running Features Agent`);
  console.log(`[Step] Total chunks: ${chunks.length}, using: ${Math.min(chunks.length, 50)}`);

  const features = await featuresAgent.execute({
    repoName: repoData.name,
    overview: recon.overview,
    readme: repoData.readme,
    codeChunks: chunks.slice(0, 50), // Top 50 prioritized chunks (functions > classes > methods)
  });

  console.log(`[Step] ✓ Detected ${features.features.length} features`);
  return features;
}
