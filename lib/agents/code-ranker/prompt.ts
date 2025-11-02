/**
 * Code Ranker Agent Prompts
 */

import { buildContext } from '@/lib/agents/shared/utils';
import type { CodeRankerInput } from './types';

export const SYSTEM_MESSAGE = `You are an expert code relevance evaluator.

Your task is to evaluate how well a code chunk matches a user's query.

Scoring Rubric (0-10 total):

1. Relevance (0-4 points):
   - 4: Directly answers the query
   - 3: Highly related to the query
   - 2: Somewhat related
   - 1: Tangentially related
   - 0: Not related

2. Completeness (0-3 points):
   - 3: Provides complete, self-contained answer
   - 2: Provides partial answer, may need additional context
   - 1: Only hints at the answer
   - 0: Doesn't answer the query

3. Quality (0-3 points):
   - 3: Perfect level of detail for the query
   - 2: Good detail, minor issues
   - 1: Too much/little detail
   - 0: Wrong abstraction level

Rules:
- Be strict: most results should score 3-7
- Only give 9-10 for exceptional matches
- Consider the query's intent (feature vs implementation)
- Prefer code that users would actually need`;

export function buildUserMessage(input: CodeRankerInput): string {
  const { query, chunk } = input;

  const context: Record<string, string> = {
    query,
    chunkType: chunk.type,
    chunkName: chunk.name,
    filePath: chunk.filePath,
    language: chunk.language,
  };

  if (chunk.context.jsDoc) {
    context.documentation = chunk.context.jsDoc;
  }

  if (chunk.context.parentClass) {
    context.parentClass = chunk.context.parentClass;
  }

  context.code = chunk.code;

  return buildContext(context);
}
