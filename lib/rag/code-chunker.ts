/**
 * Semantic Chunker - Extract functions/classes/methods from AST
 *
 * Extracts complete semantic units with precise line numbers and context
 */

import type Parser from 'tree-sitter';
import type {ChunkType, CodeChunk, Language} from './types';

/**
 * AST node type to chunk type mapping per language
 */
const NODE_TYPE_MAPPINGS: Record<Language, Record<string, ChunkType>> = {
  javascript: {
    function_declaration: 'function',
    function: 'function',
    arrow_function: 'function',
    function_expression: 'function',
    method_definition: 'method',
    class_declaration: 'class',
  },
  typescript: {
    function_declaration: 'function',
    function: 'function',
    arrow_function: 'function',
    function_expression: 'function',
    method_definition: 'method',
    method_signature: 'method',
    class_declaration: 'class',
    interface_declaration: 'interface',
    type_alias_declaration: 'interface',
    enum_declaration: 'constant',
  },
  tsx: {
    function_declaration: 'function',
    function: 'function',
    arrow_function: 'function',
    function_expression: 'function',
    method_definition: 'method',
    class_declaration: 'class',
    interface_declaration: 'interface',
    type_alias_declaration: 'interface',
    jsx_element: 'component',
  },
  python: {
    function_definition: 'function',
    class_definition: 'class',
  },
  go: {
    function_declaration: 'function',
    method_declaration: 'method',
    type_declaration: 'interface',
  },
  rust: {
    function_item: 'function',
    impl_item: 'method',
    struct_item: 'class',
    enum_item: 'constant',
    trait_item: 'interface',
  },
};

/**
 * Extract name from AST node
 */
function extractName(node: Parser.SyntaxNode): string {
  // Try common name fields
  const nameNode =
    node.childForFieldName('name') ||
    node.childForFieldName('identifier') ||
    node.childForFieldName('id');

  if (nameNode) {
    return nameNode.text;
  }

  // Fallback: look for identifier child
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && (child.type === 'identifier' || child.type === 'type_identifier')) {
      return child.text;
    }
  }

  return 'anonymous';
}

/**
 * Extract JSDoc/docstring comment above a node
 */
function extractJSDoc(node: Parser.SyntaxNode, lines: string[]): string | undefined {
  const startLine = node.startPosition.row;

  // Look at lines above for comments
  const commentLines: string[] = [];

  for (let i = startLine - 1; i >= 0 && i >= startLine - 10; i--) {
    const line = lines[i].trim();

    // JSDoc style: /** ... */
    if (line.startsWith('/**') || line.startsWith('*') || line.endsWith('*/')) {
      commentLines.unshift(line);
    }
    // Python style: """..."""
    else if (line.startsWith('"""') || line.startsWith("'''")) {
      commentLines.unshift(line);
      break;
    }
    // Single line comments: // or #
    else if (line.startsWith('//') || line.startsWith('#')) {
      commentLines.unshift(line);
    }
    // Stop if we hit non-comment
    else if (line.length > 0) {
      break;
    }
  }

  return commentLines.length > 0 ? commentLines.join('\n') : undefined;
}

/**
 * Extract imports from code (simple heuristic)
 */
function extractImports(code: string): string[] {
  const imports: string[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // JavaScript/TypeScript imports
    if (trimmed.startsWith('import ')) {
      imports.push(trimmed);
    }
    // Python imports
    else if (trimmed.startsWith('from ') || trimmed.startsWith('import ')) {
      imports.push(trimmed);
    }
    // Go imports
    else if (trimmed.startsWith('import ') || trimmed.startsWith('import(')) {
      imports.push(trimmed);
    }
    // Rust use statements
    else if (trimmed.startsWith('use ')) {
      imports.push(trimmed);
    }
  }

  return imports;
}

/**
 * Extract keywords from code for BM25 search
 */
function extractKeywords(chunk: Omit<CodeChunk, 'keywords' | 'embedding'>): string[] {
  const keywords: string[] = [];

  // Add name
  keywords.push(chunk.name);

  // Add type
  keywords.push(chunk.type);

  // Add words from file path
  const pathParts = chunk.filePath.split('/').pop()?.split('.')[0];
  if (pathParts) {
    keywords.push(pathParts);
  }

  // Extract camelCase/snake_case words from name
  const nameWords = chunk.name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 2);

  keywords.push(...nameWords);

  // Add parent class if method
  if (chunk.context.parentClass) {
    keywords.push(chunk.context.parentClass);
  }

  return [...new Set(keywords)]; // Deduplicate
}

/**
 * Create a unique ID for a chunk
 */
function createChunkId(filePath: string, startLine: number): string {
  return `${filePath}:${startLine}`;
}

/**
 * Extract a single chunk from an AST node
 */
function extractChunk(
  node: Parser.SyntaxNode,
  filePath: string,
  content: string,
  lines: string[],
  language: Language,
  chunkType: ChunkType,
  parentClass?: string
): CodeChunk {
  const name = extractName(node);
  const startLine = node.startPosition.row + 1; // 1-indexed
  const endLine = node.endPosition.row + 1;
  const code = content.slice(node.startIndex, node.endIndex);

  const jsDoc = extractJSDoc(node, lines);
  const imports = extractImports(code);

  const baseChunk: Omit<CodeChunk, 'keywords' | 'embedding'> = {
    id: createChunkId(filePath, startLine),
    filePath,
    startLine,
    endLine,
    type: chunkType,
    name,
    language,
    code,
    context: {
      imports,
      exports: [], // TODO: Detect exports
      parentClass,
      jsDoc,
      dependencies: [],
    },
  };

  return {
    ...baseChunk,
    keywords: extractKeywords(baseChunk),
  };
}

/**
 * Extract all semantic chunks from an AST
 */
export function extractSemanticChunks(
  tree: Parser.Tree,
  filePath: string,
  content: string,
  language: Language
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const lines = content.split('\n');
  const nodeTypes = NODE_TYPE_MAPPINGS[language];

  if (!nodeTypes) {
    console.warn(`No node type mappings for language: ${language}`);
    return chunks;
  }

  let currentClass: string | undefined;

  function visit(node: Parser.SyntaxNode) {
    // Check if this node type should be extracted
    const chunkType = nodeTypes[node.type];

    if (chunkType) {
      // Track current class for methods
      if (chunkType === 'class') {
        currentClass = extractName(node);
      }

      // Extract the chunk
      chunks.push(
        extractChunk(
          node,
          filePath,
          content,
          lines,
          language,
          chunkType,
          chunkType === 'method' ? currentClass : undefined
        )
      );
    }

    // Recursively visit children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        visit(child);
      }
    }

    // Reset class context after leaving class node
    if (chunkType === 'class') {
      currentClass = undefined;
    }
  }

  visit(tree.rootNode);

  return chunks;
}

/**
 * Get chunker statistics
 */
export function getChunkerStats(chunks: CodeChunk[]) {
  const typeCount: Record<string, number> = {};
  const languageCount: Record<string, number> = {};
  let totalSize = 0;

  for (const chunk of chunks) {
    typeCount[chunk.type] = (typeCount[chunk.type] || 0) + 1;
    languageCount[chunk.language] = (languageCount[chunk.language] || 0) + 1;
    totalSize += chunk.code.length;
  }

  return {
    totalChunks: chunks.length,
    byType: typeCount,
    byLanguage: languageCount,
    averageSize: Math.round(totalSize / chunks.length),
    totalSize,
  };
}
