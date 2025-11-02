/**
 * Code Architecture Agent Types
 */

import type { CodeChunk } from '@/lib/rag/types';

export interface ArchitectureInput {
  /**
   * Repository overview from Recon
   */
  repoOverview: string;

  /**
   * Architecture pattern from Recon
   */
  architecturePattern: {
    pattern: string;
    description: string;
  };

  /**
   * Relevant code chunks showing structure
   */
  codeChunks: CodeChunk[];

  /**
   * Directory structure
   */
  directories: Array<{
    directory: string;
    purpose: string;
  }>;
}

export interface ArchitectureOutput {
  /**
   * High-level architecture overview
   */
  overview: string;

  /**
   * Component hierarchy (for frontend apps)
   */
  componentHierarchy?: {
    description: string;
    structure: string[];
  };

  /**
   * Data flow explanation
   */
  dataFlow: {
    description: string;
    steps: Array<{
      step: string;
      description: string;
    }>;
  };

  /**
   * API structure (if applicable)
   */
  apiStructure?: {
    description: string;
    endpoints: string[];
  };

  /**
   * Key patterns used
   */
  patterns: Array<{
    pattern: string;
    usage: string;
    example: string;
  }>;
}
