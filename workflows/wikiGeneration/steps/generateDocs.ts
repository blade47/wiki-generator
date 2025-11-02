/**
 * Step: Generate Documentation for a Single Feature
 */

import { docsGeneratorAgent, type DocsGeneratorOutput } from '@/lib/agents/docs-generator';
import type { CodeChunk } from '@/lib/rag/types';
import type { FeaturesOutput } from '@/lib/agents/features';

interface GenerateDocsInput {
  feature: FeaturesOutput['features'][0];
  repoName: string;
  repoOverview: string;
  relevantChunks: CodeChunk[];
}

export async function generateDocs(input: GenerateDocsInput): Promise<DocsGeneratorOutput> {
  'use step';

  const { feature, repoName, repoOverview, relevantChunks } = input;

  console.log(`[Step] Generating docs for feature: ${feature.name} with ${relevantChunks.length} code chunks`);

  // Generate documentation
  const docs = await docsGeneratorAgent.execute({
    feature,
    codeChunks: relevantChunks,
    repoContext: {
      name: repoName,
      overview: repoOverview,
    },
  });

  console.log(`[Step] ✓ Generated ${docs.codeExamples.length} code examples`);
  return docs;
}
