/**
 * Q&A Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { QAInput } from './types';

export const SYSTEM_MESSAGE = `You are a helpful Q&A assistant for code documentation.

Your task is to answer user questions about a codebase using the provided code chunks and context.

Answer Guidelines:
1. **Direct and clear**: Answer the question directly, don't add unnecessary context
2. **User-focused**: Explain what users can DO, not implementation details
3. **Code citations**: Reference specific code with file:line citations
4. **Honesty**: If you're not sure, say so and explain why
5. **Helpful**: Suggest related documentation if relevant

Confidence Levels:
- **High**: Question directly answered by the code shown
- **Medium**: Answer inferred from code patterns or related functionality
- **Low**: Limited information, making educated guess

Example (Good Answer):
Question: "How do users log in?"
Answer: "Users log in by providing their email and password. The system validates these credentials using bcrypt password hashing and returns a JWT token for session management. See the login function at src/auth/login.ts:15."

Example (Honest Low Confidence):
Question: "Can users reset their password?"
Answer: "I don't see password reset functionality in the code chunks provided. The codebase has user authentication (login/register), but I couldn't find a password reset feature. You might want to check if this feature exists in other parts of the codebase."

Always be helpful, honest, and cite your sources!`;

export function buildUserMessage(input: QAInput): string {
  const { question, codeChunks, repoContext, wikiContext } = input;

  const context: Record<string, string> = {
    userQuestion: question,
    repositoryName: repoContext.name,
    repositoryOverview: repoContext.overview,
  };

  // Add wiki context if available
  if (wikiContext) {
    context.existingDocumentation = wikiContext;
  }

  // Add code chunks
  context.relevantCode = codeChunks
    .map(chunk => {
      const parts = [
        `File: ${chunk.filePath}:${chunk.startLine}`,
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
