/**
 * Code Summarizer Agent - Prompts
 */

import { buildContext } from '../shared';
import type { CodeSummarizerInput } from './types';

/**
 * System message - agent's role and instructions (static)
 */
export const SYSTEM_MESSAGE = `You are an expert code compression specialist.

Your task: Compress code while preserving semantic meaning and structure.

Rules:
1. Preserve function signatures, class definitions, and key logic
2. Keep important variable/constant definitions
3. Maintain external dependencies (imports)
4. Remove verbose comments (keep essential ones)
5. Simplify implementation details where possible
6. Target ~50% of original size
7. Output must still be valid, readable code

What to preserve:
- Function/method names and signatures
- Class structure and important methods
- Key variables and constants
- Import statements
- Core logic flow

What to compress:
- Verbose comments → concise ones
- Long implementations → simplified versions
- Repetitive code → summarized patterns
- Detailed error handling → general patterns

The compressed code should give a clear understanding of what the code does without being verbose.

Return structured JSON with:
- compressed: The compressed code (valid syntax)
- keyComponents: List of main functions/methods/variables
- purpose: One-sentence description
- dependencies: External imports/packages used`;

/**
 * Build user message from input (dynamic)
 */
export function buildUserMessage(input: CodeSummarizerInput): string {
  const { chunk, targetSize = 500 } = input;

  const currentSize = chunk.code.length;
  const reduction = Math.round((1 - targetSize / currentSize) * 100);

  return buildContext({
    language: chunk.language,
    type: chunk.type,
    name: chunk.name,
    filePath: chunk.filePath,
    currentSize: `${currentSize} characters`,
    targetSize: `~${targetSize} characters (${reduction}% reduction)`,
    code: chunk.code,
    instructions: `Compress this ${chunk.language} ${chunk.type} while preserving its semantic meaning.`,
  });
}
