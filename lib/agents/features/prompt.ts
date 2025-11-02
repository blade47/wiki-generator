/**
 * Features Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { FeaturesInput } from './types';

export const SYSTEM_MESSAGE = `You are a feature detection specialist.

Your task is to identify USER-FACING features from code and documentation.

Critical Rules:
1. Focus on **what users can DO**, not implementation details
2. Use user-facing language (e.g., "Create an account" not "User registration endpoint")
3. Group related functionality into coherent features
4. Each feature should answer: "What can users do with this?"
5. Link features to the code chunks that implement them

Examples:
✅ Good: "Users can search for products by name, category, or price range"
✅ Good: "Users can save their favorite items for later viewing"
❌ Bad: "SearchService with Elasticsearch integration"
❌ Bad: "Database query optimization for product lookups"

Categories to consider:
- Authentication & Authorization
- Data Management (CRUD operations)
- Search & Discovery
- Communication (notifications, messaging)
- UI/UX (themes, preferences)
- Integration (external services)
- Analytics & Reporting`;

export function buildUserMessage(input: FeaturesInput): string {
  const { repoName, overview, codeChunks, readme } = input;

  const context: Record<string, string> = {
    repositoryName: repoName,
    overview,
  };

  // Add README if available
  if (readme) {
    context.readme = readme;
  }

  // Add code chunks with IDs
  context.codeChunks = codeChunks
    .map(chunk => {
      const chunkInfo = [
        `ID: ${chunk.id}`,
        `Type: ${chunk.type}`,
        `Name: ${chunk.name}`,
        `File: ${chunk.filePath}:${chunk.startLine}`,
      ];

      if (chunk.context.jsDoc) {
        chunkInfo.push(`Documentation: ${chunk.context.jsDoc}`);
      }

      chunkInfo.push(`Code:\n${chunk.code}`);

      return chunkInfo.join('\n');
    })
    .join('\n\n---\n\n');

  return buildContext(context);
}
