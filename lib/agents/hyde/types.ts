/**
 * HyDE Agent Types
 *
 * HyDE = Hypothetical Document Embeddings
 * Generates hypothetical code/docs that would answer the query
 * to improve RAG retrieval quality
 */

export interface HyDEInput {
  /**
   * User's query/question
   */
  query: string;

  /**
   * Repository context
   */
  repoContext: {
    name: string;
    overview: string;
    techStack: string[];
  };

  /**
   * Number of hypothetical documents to generate
   */
  count?: number;
}

export interface HyDEOutput {
  /**
   * Original query
   */
  originalQuery: string;

  /**
   * Expanded queries (alternative phrasings)
   */
  expandedQueries: string[];

  /**
   * Hypothetical code snippets that would answer the query
   */
  hypotheticalCode: Array<{
    description: string;
    code: string;
  }>;

  /**
   * Hypothetical documentation that would answer the query
   */
  hypotheticalDocs: Array<{
    title: string;
    content: string;
  }>;
}
