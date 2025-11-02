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
6. **REQUIRED**: Rate each feature's importance (1-10 integer). Every feature MUST have an importance score.

Feature Examples:
✅ Good: "Users can search for products by name, category, or price range" (importance: 9)
✅ Good: "Users can save their favorite items for later viewing" (importance: 6)
❌ Bad: "SearchService with Elasticsearch integration" (implementation detail)
❌ Bad: "Database query optimization for product lookups" (technical, not user-facing)

Importance Rating Guidelines (1-10):

**For Applications (end-user apps):**
- **10**: Critical core feature essential to the app's primary purpose (e.g., "Tweet posting" in Twitter)
- **8-9**: Major feature that users frequently rely on (e.g., "Direct messaging")
- **6-7**: Important feature that enhances user experience (e.g., "Like tweets")
- **4-5**: Useful enhancement or secondary feature (e.g., "Change theme")
- **2-3**: Nice-to-have or convenience feature (e.g., "Keyboard shortcuts")
- **1**: Minor utility or edge case feature

**For Libraries/SDKs (developer tools):**
- **10**: Core API functionality used in most implementations
- **8-9**: Commonly used utilities/methods
- **6-7**: Specialized but frequently needed functionality
- **4-5**: Less common but useful features
- **2-3**: Edge case or rarely used features
- **1**: Deprecated or niche utilities

**If unclear, use 5 (moderate importance) as default.**

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
