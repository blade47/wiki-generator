/**
 * Non-Code File Chunker
 *
 * Handles markdown, README, and metadata files
 */

import type { CodeChunk } from './types';

/**
 * Check if file is a markdown file
 */
export function isMarkdown(filePath: string): boolean {
  return /\.md$/i.test(filePath);
}

/**
 * Check if file is README
 */
export function isReadme(filePath: string): boolean {
  return /README\.md$/i.test(filePath);
}

/**
 * Check if file is metadata (package.json, etc.)
 */
export function isMetadata(filePath: string): boolean {
  const metadataFiles = [
    'package.json',
    'Cargo.toml',
    'go.mod',
    'requirements.txt',
    'setup.py',
    'pyproject.toml',
    'composer.json',
    'Gemfile',
  ];

  const fileName = filePath.split('/').pop() || '';
  return metadataFiles.includes(fileName);
}

/**
 * Check if any non-code file should be indexed
 */
export function shouldIndexNonCode(filePath: string): boolean {
  return isMarkdown(filePath) || isMetadata(filePath);
}

/**
 * Extract keywords from markdown content
 */
function extractMarkdownKeywords(content: string): string[] {
  const keywords: string[] = [];

  // Extract headers (## Title)
  const headers = content.match(/^#{1,3}\s+(.+)$/gm);
  if (headers) {
    headers.forEach(header => {
      const text = header.replace(/^#+\s+/, '').toLowerCase();
      keywords.push(...text.split(/\s+/).filter(w => w.length > 3));
    });
  }

  // Extract bold text (**important**)
  const bold = content.match(/\*\*([^*]+)\*\*/g);
  if (bold) {
    bold.forEach(b => {
      const text = b.replace(/\*\*/g, '').toLowerCase();
      keywords.push(...text.split(/\s+/).filter(w => w.length > 3));
    });
  }

  return [...new Set(keywords)];
}

/**
 * Chunk README.md as a single chunk (usually most important doc)
 */
export function chunkReadme(filePath: string, content: string): CodeChunk {
  const lines = content.split('\n');

  return {
    id: `${filePath}:1`,
    filePath,
    startLine: 1,
    endLine: lines.length,
    type: 'readme',
    name: 'README',
    language: 'markdown',
    code: content,
    context: {
      imports: [],
      exports: [],
      dependencies: [],
    },
    keywords: ['readme', 'documentation', ...extractMarkdownKeywords(content)],
  };
}

/**
 * Split markdown by sections (## headers)
 */
export function chunkMarkdownBySections(filePath: string, content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const lines = content.split('\n');

  // Find all section headers (## or ###)
  const sections: Array<{ line: number; level: number; title: string }> = [];

  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      sections.push({
        line: idx + 1, // 1-indexed
        level: match[1].length,
        title: match[2].trim(),
      });
    }
  });

  // If no sections, treat as single chunk
  if (sections.length === 0) {
    return [
      {
        id: `${filePath}:1`,
        filePath,
        startLine: 1,
        endLine: lines.length,
        type: 'documentation',
        name: filePath.split('/').pop() || 'document',
        language: 'markdown',
        code: content,
        context: {
          imports: [],
          exports: [],
          dependencies: [],
        },
        keywords: extractMarkdownKeywords(content),
      },
    ];
  }

  // Create chunks for each section
  sections.forEach((section, idx) => {
    const startLine = section.line;
    const endLine = idx < sections.length - 1 ? sections[idx + 1].line - 1 : lines.length;

    const sectionContent = lines.slice(startLine - 1, endLine).join('\n');

    chunks.push({
      id: `${filePath}:${startLine}`,
      filePath,
      startLine,
      endLine,
      type: 'documentation',
      name: section.title,
      language: 'markdown',
      code: sectionContent,
      context: {
        imports: [],
        exports: [],
        dependencies: [],
      },
      keywords: [
        section.title.toLowerCase(),
        ...extractMarkdownKeywords(sectionContent),
      ],
    });
  });

  return chunks;
}

/**
 * Extract metadata from package.json-like files
 */
export function chunkMetadata(filePath: string, content: string): CodeChunk {
  const lines = content.split('\n');

  // Try to parse as JSON
  let metadata: Record<string, unknown> = {};
  let keywords: string[] = [];

  try {
    metadata = JSON.parse(content);

    // Extract useful fields as keywords
    if (typeof metadata.name === 'string') {
      keywords.push(metadata.name);
    }
    if (typeof metadata.description === 'string') {
      keywords.push(...metadata.description.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    }
    if (Array.isArray(metadata.keywords)) {
      keywords.push(...metadata.keywords.map(k => String(k).toLowerCase()));
    }
    if (typeof metadata.dependencies === 'object' && metadata.dependencies) {
      keywords.push(...Object.keys(metadata.dependencies));
    }
  } catch {
    // Not JSON, use file as-is
    keywords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 20);
  }

  return {
    id: `${filePath}:1`,
    filePath,
    startLine: 1,
    endLine: lines.length,
    type: 'metadata',
    name: filePath.split('/').pop() || 'metadata',
    language: 'json',
    code: content,
    context: {
      imports: [],
      exports: [],
      dependencies: typeof metadata.dependencies === 'object' && metadata.dependencies
        ? Object.keys(metadata.dependencies)
        : [],
    },
    keywords: [...new Set(keywords)],
  };
}

/**
 * Main entry point: chunk any non-code file
 */
export function chunkNonCodeFile(filePath: string, content: string): CodeChunk[] {
  // README gets special treatment (single chunk, high priority)
  if (isReadme(filePath)) {
    return [chunkReadme(filePath, content)];
  }

  // Other markdown files split by sections
  if (isMarkdown(filePath)) {
    return chunkMarkdownBySections(filePath, content);
  }

  // Metadata files (package.json, etc.)
  if (isMetadata(filePath)) {
    return [chunkMetadata(filePath, content)];
  }

  return [];
}
