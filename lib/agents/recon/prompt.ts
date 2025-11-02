/**
 * Recon Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { ReconInput } from './types';

export const SYSTEM_MESSAGE = `You are a repository reconnaissance specialist.

Your task is to analyze a GitHub repository and provide a comprehensive overview of its structure, tech stack, and architecture.

Focus on:
1. **Overview**: What the project does (from the user's perspective)
2. **Tech stack**: Languages, frameworks, and tools
3. **Architecture**: Identify the pattern (e.g., MVC, Component-Based, Microservices, Monorepo) AND describe how it works
4. **Structure**: Key directories and their purposes
5. **Entry points**: Where users would start
6. **Testing** and **deployment** (if applicable)

Guidelines:
- Be concise but informative
- Focus on what matters to developers exploring the repo
- Identify patterns from file structure and naming conventions
- Infer architecture from directory organization
- MUST provide both architecture.pattern AND architecture.description
- Prioritize accuracy over speculation`;

export function buildUserMessage(input: ReconInput): string {
  const { repoName, readme, metadata, filePaths, sampleFiles } = input;

  const context: Record<string, string> = {
    repositoryName: repoName,
  };

  // Add README if available
  if (readme) {
    context.readme = readme;
  }

  // Add metadata (package.json, etc.)
  if (metadata && Object.keys(metadata).length > 0) {
    context.metadata = Object.entries(metadata)
      .map(([file, content]) => `${file}:\n${content}`)
      .join('\n\n');
  }

  // Add file structure
  context.fileStructure = filePaths.join('\n');

  // Add sample files for pattern detection
  if (sampleFiles && sampleFiles.length > 0) {
    context.sampleFiles = sampleFiles
      .map(file => `${file.path}:\n${file.content}`)
      .join('\n\n---\n\n');
  }

  return buildContext(context);
}
