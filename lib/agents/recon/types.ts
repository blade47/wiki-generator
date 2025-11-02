/**
 * Recon Agent Types
 */

export interface ReconInput {
  /**
   * Repository name
   */
  repoName: string;

  /**
   * README content (if available)
   */
  readme?: string;

  /**
   * Package.json or similar metadata files
   */
  metadata?: Record<string, string>;

  /**
   * List of all file paths in the repo
   */
  filePaths: string[];

  /**
   * Sample code files (for pattern detection)
   */
  sampleFiles?: Array<{
    path: string;
    content: string;
  }>;
}

export interface ReconOutput {
  /**
   * Repository overview (1-2 paragraphs)
   */
  overview: string;

  /**
   * Tech stack
   */
  techStack: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };

  /**
   * Architecture pattern
   */
  architecture: {
    pattern: string;
    description: string;
  };

  /**
   * Key directories and their purposes
   */
  structure: Array<{
    directory: string;
    purpose: string;
  }>;

  /**
   * Entry points (main files users would interact with)
   */
  entryPoints: string[];

  /**
   * Testing approach (if detected)
   */
  testing?: string;

  /**
   * Build and deployment info (if detected)
   */
  deployment?: string;
}
