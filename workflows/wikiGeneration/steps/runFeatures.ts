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

  const features = await featuresAgent.execute({
    repoName: repoData.name,
    overview: recon.overview,
    readme: repoData.readme,
    codeChunks: chunks.slice(0, 50),
  });

  console.log(`[Step] ✓ Detected ${features.features.length} features`);
  return features;
}
