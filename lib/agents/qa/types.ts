/**
 * Q&A Agent Types
 */

import type { CodeChunk } from '@/lib/rag/types';

export interface QAInput {
  /**
   * User's question
   */
  question: string;

  /**
   * Relevant code chunks from RAG search
   */
  codeChunks: CodeChunk[];

  /**
   * Repository context
   */
  repoContext: {
    name: string;
    overview: string;
  };

  /**
   * Existing wiki content (optional - for context)
   */
  wikiContext?: string;
}

export interface QAOutput {
  /**
   * Direct answer to the question
   */
  answer: string;

  /**
   * Code references that support the answer
   */
  codeReferences: Array<{
    file: string;
    lineNumber: number;
    description: string;
    code: string;
  }>;

  /**
   * Related documentation sections
   */
  relatedDocs?: string[];

  /**
   * Confidence level
   */
  confidence: 'high' | 'medium' | 'low';

  /**
   * Explanation of confidence
   */
  confidenceReason: string;
}
