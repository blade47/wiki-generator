/**
 * Multi-Language Parser using Tree-sitter
 *
 * Supports: JavaScript, TypeScript, Python, Go, Rust
 */

import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Go from 'tree-sitter-go';
import Rust from 'tree-sitter-rust';
import type { Language } from './types';

/**
 * Available parsers for each language
 */
const PARSERS = {
  javascript: JavaScript,
  typescript: TypeScript.typescript,
  tsx: TypeScript.tsx,
  python: Python,
  go: Go,
  rust: Rust,
} as const;

/**
 * File extension to language mapping
 */
const EXTENSION_MAP: Record<string, Language> = {
  // JavaScript
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',

  // TypeScript
  ts: 'typescript',
  tsx: 'tsx',
  mts: 'typescript',
  cts: 'typescript',

  // Python
  py: 'python',
  pyw: 'python',
  pyi: 'python',

  // Go
  go: 'go',

  // Rust
  rs: 'rust',
};

/**
 * Detect language from file path
 */
export function detectLanguage(filePath: string): Language | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  return EXTENSION_MAP[ext] || null;
}

/**
 * Check if file is supported
 */
export function isSupported(filePath: string): boolean {
  return detectLanguage(filePath) !== null;
}

/**
 * Parse a single file and return AST
 */
export function parseFile(
  filePath: string,
  content: string
): { tree: Parser.Tree; language: Language } | null {
  const language = detectLanguage(filePath);

  if (!language) {
    return null;
  }

  if (!PARSERS[language]) {
    console.warn(`Parser not available for language: ${language}`);
    return null;
  }

  try {
    const parser = new Parser();
    parser.setLanguage(PARSERS[language] as Parser.Language);

    const tree = parser.parse(content);

    return { tree, language };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Get parser statistics
 */
export function getParserStats() {
  return {
    supportedLanguages: Object.keys(PARSERS),
    supportedExtensions: Object.keys(EXTENSION_MAP),
    totalParsers: Object.keys(PARSERS).length,
  };
}
