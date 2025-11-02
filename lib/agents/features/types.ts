/**
 * Features Agent Types
 */

import type { CodeChunk } from '@/lib/rag/types';

export interface FeaturesInput {
  /**
   * Repository name
   */
  repoName: string;

  /**
   * Repository overview from Recon Agent
   */
  overview: string;

  /**
   * Relevant code chunks from RAG search
   */
  codeChunks: CodeChunk[];

  /**
   * README content (if available)
   */
  readme?: string;
}

export interface Feature {
  /**
   * Feature name (user-facing, e.g., "User Authentication")
   */
  name: string;

  /**
   * What users can do (e.g., "Users can log in with email and password")
   */
  description: string;

  /**
   * Importance score (1-10, where 10 is critical and 1 is minor)
   * Defaults to 5 if not provided
   */
  importance?: number;

  /**
   * Related code chunks (references by ID)
   */
  relatedChunks: string[];

  /**
   * Category (e.g., "Authentication", "Data Management", "UI/UX")
   */
  category: string;
}

export interface FeaturesOutput {
  /**
   * List of detected features
   */
  features: Feature[];

  /**
   * Summary of what the app does
   */
  summary: string;
}
