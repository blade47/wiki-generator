/**
 * Wiki Generation Workflow Types
 */

import type { ReconOutput } from '@/lib/agents/recon';
import type { FeaturesOutput } from '@/lib/agents/features';
import type { ArchitectureOutput } from '@/lib/agents/architecture';
import type { DocsGeneratorOutput } from '@/lib/agents/docs-generator';

export interface WikiGenerationInput {
  githubUrl: string;
  options?: {
    maxFiles?: number;
    maxFileSize?: number;
    maxFeaturesPerCategory?: number;
  };
}

export interface WikiPage {
  featureId: string;
  category: string;
  title: string;
  slug: string;
  content: DocsGeneratorOutput;
}

export interface WikiData {
  repoInfo: {
    name: string;
    fullName: string;
    description: string;
    url: string;
  };
  recon: ReconOutput;
  features: FeaturesOutput;
  architecture: ArchitectureOutput;
  pages: WikiPage[];
  metadata: {
    totalFiles: number;
    totalChunks: number;
    generatedAt: string;
  };
}

export interface WikiOutput {
  outputDir: string;
  pagesGenerated: number;
  wikiData: WikiData;
}
