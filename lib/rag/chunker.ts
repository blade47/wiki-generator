/**
 * Main Chunker - Routes to appropriate chunker based on file type
 */

import { parseFile, isSupported } from './parser';
import { extractSemanticChunks } from './code-chunker';
import { chunkNonCodeFile, shouldIndexNonCode } from './non-code-chunker';
import type { CodeChunk } from './types';

/**
 * Chunk a single file (code or non-code)
 */
export function chunkFile(filePath: string, content: string): CodeChunk[] {
  // Handle non-code files (markdown, metadata)
  if (shouldIndexNonCode(filePath)) {
    return chunkNonCodeFile(filePath, content);
  }

  // Handle code files
  if (isSupported(filePath)) {
    const result = parseFile(filePath, content);
    if (result) {
      return extractSemanticChunks(result.tree, filePath, content, result.language);
    }
  }

  // Unsupported file type
  return [];
}

/**
 * Check if file should be indexed at all
 */
export function shouldIndex(filePath: string): boolean {
  return shouldIndexNonCode(filePath) || isSupported(filePath);
}
