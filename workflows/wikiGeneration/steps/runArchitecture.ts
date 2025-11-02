/**
 * Step: Run Architecture Agent
 */

import { architectureAgent, type ArchitectureOutput } from '@/lib/agents/architecture';
import type { ReconOutput } from '@/lib/agents/recon';
import type { CodeChunk } from '@/lib/rag/types';

export async function runArchitecture(
  recon: ReconOutput,
  chunks: CodeChunk[]
): Promise<ArchitectureOutput> {
  'use step';

  console.log(`[Step] Running Architecture Agent`);
  console.log(`[Step] Total chunks: ${chunks.length}, using: ${Math.min(chunks.length, 30)}`);

  const architecture = await architectureAgent.execute({
    repoOverview: recon.overview,
    architecturePattern: recon.architecture,
    directories: recon.structure,
    codeChunks: chunks.slice(0, 30), // Top 30 prioritized chunks (enough to identify patterns)
  });

  console.log(`[Step] ✓ Architecture analysis complete`);
  return architecture;
}
