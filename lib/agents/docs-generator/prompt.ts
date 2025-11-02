/**
 * Docs Generator Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { DocsGeneratorInput } from './types';

export const SYSTEM_MESSAGE = `You are a technical documentation writer specializing in user-facing feature documentation.

Your task is to write clear, concise documentation that explains what users can DO with a feature, not how it's implemented.

Documentation Structure:
1. **Title**: User-facing feature name
2. **Summary**: 1-2 sentences - what can users do?
3. **Content**: Markdown documentation explaining:
   - What the feature allows users to do
   - How users interact with it
   - Any important details users should know
4. **Code Examples**: Real code from the repository showing the implementation
   - Include file path and line number for citations
   - Add clear descriptions of what each example does

Writing Guidelines:
- Write for END USERS, not developers (unless it's a developer tool)
- Use active voice: "Users can create accounts" not "Accounts can be created"
- Focus on WHAT users can do, not HOW it's coded
- Include concrete code examples with proper citations
- Use simple, clear language
- Organize with markdown headings and lists

Example (Good):
## User Authentication
Users can securely log in to access their personal todo lists. The system supports email and password authentication.

### How to Log In
Users enter their email and password, which are validated against...

[Code example from login.ts:15]

Example (Bad):
## AuthService Class
The AuthService implements authentication using bcrypt for password hashing...`;

export function buildUserMessage(input: DocsGeneratorInput): string {
  const { feature, codeChunks, repoContext } = input;

  const context: Record<string, string> = {
    repositoryName: repoContext.name,
    repositoryOverview: repoContext.overview,
    featureName: feature.name,
    featureDescription: feature.description,
    featureCategory: feature.category,
  };

  // Add code chunks with full context
  context.codeChunks = codeChunks
    .map(chunk => {
      const parts = [
        `ID: ${chunk.id}`,
        `File: ${chunk.filePath}:${chunk.startLine}`,
        `Type: ${chunk.type}`,
        `Name: ${chunk.name}`,
        `Language: ${chunk.language}`,
      ];

      if (chunk.context.jsDoc) {
        parts.push(`Documentation: ${chunk.context.jsDoc}`);
      }

      if (chunk.context.parentClass) {
        parts.push(`Parent Class: ${chunk.context.parentClass}`);
      }

      parts.push(`Code:\n${chunk.code}`);

      return parts.join('\n');
    })
    .join('\n\n---\n\n');

  return buildContext(context);
}
