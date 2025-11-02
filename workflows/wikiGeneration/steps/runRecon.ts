/**
 * Step: Run Recon Agent
 */

import { reconAgent, type ReconOutput } from '@/lib/agents/recon';
import type { RepoData } from '@/lib/github/fetcher';

export async function runRecon(repoData: RepoData): Promise<ReconOutput> {
  'use step';

  console.log(`[Step] Running Recon Agent for ${repoData.name}`);
  console.log(`[Step] Sampling ${Math.min(50, repoData.files.length)} files for analysis`);

  const recon = await reconAgent.execute({
    repoName: repoData.name,
    readme: repoData.readme,
    filePaths: repoData.files.map(f => f.path),
    sampleFiles: repoData.files.slice(0, 50).map(f => ({
      path: f.path,
      content: f.content.slice(0, 3000), // 3KB per file for better context
    })),
  });

  console.log(`[Step] ✓ Recon complete: ${recon.overview.slice(0, 100)}...`);
  return recon;
}
