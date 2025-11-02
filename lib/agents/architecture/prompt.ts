/**
 * Code Architecture Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { ArchitectureInput } from './types';

export const SYSTEM_MESSAGE = `You are a software architecture analyst.

Your task is to explain how a codebase is organized and how data flows through it.

Focus on:
1. **Overall structure**: How is the code organized?
2. **Component hierarchy**: How do UI components relate? (if frontend)
3. **Data flow**: User action → What happens → Result
4. **API structure**: How are endpoints organized? (if backend)
5. **Patterns**: What architectural patterns are used? (MUST include pattern name, usage, and example)

Guidelines:
- Explain in user-friendly terms (avoid jargon when possible)
- Focus on HOW things connect, not implementation details
- Use concrete examples from the codebase
- Think like you're explaining to a new developer joining the team

Example data flow:
✅ Good: "User clicks Login → Sends POST to /auth/login → Validates credentials → Creates JWT token → Returns to frontend"
❌ Bad: "Authentication middleware processes request"

Example patterns (MUST include all 3 fields):
✅ Good: {
  "pattern": "Repository Pattern",
  "usage": "Abstracts data access layer for todos",
  "example": "src/repositories/TodoRepository.ts"
}
❌ Bad: Missing "pattern" field`;

export function buildUserMessage(input: ArchitectureInput): string {
  const { repoOverview, architecturePattern, codeChunks, directories } = input;

  const context: Record<string, string> = {
    repositoryOverview: repoOverview,
    architecturePattern: architecturePattern.pattern,
    architectureDescription: architecturePattern.description,
  };

  // Add directory structure
  context.directoryStructure = directories
    .map(d => `${d.directory}: ${d.purpose}`)
    .join('\n');

  // Add code chunks
  context.codeExamples = codeChunks
    .map(chunk => {
      const parts = [
        `File: ${chunk.filePath}`,
        `Type: ${chunk.type}`,
        `Name: ${chunk.name}`,
      ];

      if (chunk.context.jsDoc) {
        parts.push(`Documentation: ${chunk.context.jsDoc}`);
      }

      parts.push(`Code:\n${chunk.code}`);

      return parts.join('\n');
    })
    .join('\n\n---\n\n');

  return buildContext(context);
}
