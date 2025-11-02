/**
 * Docs Generator Agent Types
 */

import type { CodeChunk } from '@/lib/rag/types';
import type { Feature } from '../features/types';

export interface DocsGeneratorInput {
  /**
   * Feature to document
   */
  feature: Feature;

  /**
   * Relevant code chunks from RAG
   */
  codeChunks: CodeChunk[];

  /**
   * Repository context
   */
  repoContext: {
    name: string;
    overview: string;
  };
}

export interface DocsGeneratorOutput {
  /**
   * Feature title (user-facing)
   */
  title: string;

  /**
   * Feature summary (1-2 sentences)
   */
  summary: string;

  /**
   * Main documentation content (markdown)
   */
  content: string;

  /**
   * Code examples with explanations
   */
  codeExamples: Array<{
    title: string;
    description: string;
    code: string;
    language: string;
    sourceFile: string;
    lineNumber: number;
  }>;

  /**
   * Related features (if any)
   */
  relatedFeatures?: string[];
}
