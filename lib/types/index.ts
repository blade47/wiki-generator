// Core types for the Wiki Generator

export interface RepoFile {
  path: string;
  content: string;
  size: number;
  sha: string;
}

export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  language: string | null;
  stars: number;
  topics: string[];
}

export interface RepoContext {
  metadata: RepoMetadata;
  readme: string | null;
  packageJson: Record<string, unknown> | null;
  mainFiles: RepoFile[];
  allFiles: RepoFile[];
}

// Agent outputs
export interface ReconOutput {
  purpose: string;
  targetUsers: string[];
  problems: string[];
  keyCapabilities: string[];
  techStack: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  userStory: string;
  entryPoints: string[];
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface FeatureDetectionOutput {
  features: Feature[];
  reasoning: string;
}

export interface CodeLocation {
  file: string;
  lines: [number, number];
  snippet: string;
}

export interface FeatureImplementation {
  feature: Feature;
  locations: CodeLocation[];
  dependencies: string[];
  flowDescription: string;
}

export interface WikiPage {
  featureId: string;
  title: string;
  content: string;
  codeReferences: Array<{
    file: string;
    line: number;
    url: string;
    description: string;
  }>;
  relatedFeatures: string[];
}

export interface QualityScore {
  coverage: number; // 0-100
  clarity: number; // 0-100
  accuracy: number; // 0-100
  userFocus: number; // 0-100
  overall: number; // 0-100
  suggestions: string[];
}
