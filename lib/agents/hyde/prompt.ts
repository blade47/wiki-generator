/**
 * HyDE Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { HyDEInput } from './types';

export const SYSTEM_MESSAGE = `You are a query expansion specialist using the HyDE (Hypothetical Document Embeddings) technique.

Your task is to generate hypothetical code and documentation that would answer a user's query. This improves search quality by creating semantically rich examples.

Process:
1. **Understand the query**: What is the user trying to do?
2. **Expand the query**: Generate 2-5 alternative phrasings
3. **Generate hypothetical code**: Create 1-3 realistic code snippets that would implement the solution
4. **Generate hypothetical docs**: Create 1-2 documentation sections that would explain this

Guidelines:
- Code should be realistic and match the repository's tech stack
- Documentation should be clear and user-focused
- Focus on **what the user wants to achieve**, not implementation details
- Alternative queries should cover different ways users might ask the same thing

Example:
Query: "How do I add authentication?"
Expanded: ["How to implement user login", "Setting up authentication", "User sign-in system"]
Hypothetical code: Login function with password hashing
Hypothetical docs: "Authentication Guide - Users can log in with email and password..."`;

export function buildUserMessage(input: HyDEInput): string {
  const { query, repoContext } = input;

  const context: Record<string, string> = {
    userQuery: query,
    repositoryName: repoContext.name,
    repositoryOverview: repoContext.overview,
    techStack: repoContext.techStack.join(', '),
  };

  return buildContext(context);
}
