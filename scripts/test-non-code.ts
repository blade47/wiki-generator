/**
 * Test script for non-code file chunking (markdown, metadata)
 */

import { chunkFile, shouldIndex } from '@/lib/rag/chunker';
import { getChunkerStats } from '@/lib/rag/code-chunker';

const testFiles = [
  {
    path: 'README.md',
    content: `
# Awesome Project

A revolutionary tool for developers.

## Features

- **Fast**: Lightning-fast performance
- **Simple**: Easy to use
- **Powerful**: Advanced capabilities

## Installation

\`\`\`bash
npm install awesome-project
\`\`\`

## Usage

Import and use:

\`\`\`javascript
import { awesome } from 'awesome-project';
awesome.doSomething();
\`\`\`

## API Reference

### \`doSomething()\`

Does something awesome.
    `.trim(),
  },
  {
    path: 'docs/guide.md',
    content: `
# User Guide

Learn how to use the project.

## Getting Started

First, install the dependencies.

## Configuration

Edit the config file.

## Advanced Usage

For power users.
    `.trim(),
  },
  {
    path: 'package.json',
    content: JSON.stringify(
      {
        name: 'awesome-project',
        version: '1.0.0',
        description: 'A revolutionary tool for developers',
        keywords: ['tool', 'developer', 'awesome'],
        dependencies: {
          react: '^18.0.0',
          typescript: '^5.0.0',
        },
      },
      null,
      2
    ),
  },
];

console.log('=== Testing Non-Code File Chunking ===\n');

for (const file of testFiles) {
  console.log(`\n📄 File: ${file.path}`);
  console.log('─'.repeat(60));

  const shouldIndexFile = shouldIndex(file.path);
  console.log(`  Should index: ${shouldIndexFile ? '✓ Yes' : '✗ No'}`);

  if (!shouldIndexFile) continue;

  const chunks = chunkFile(file.path, file.content);

  console.log(`  Total chunks: ${chunks.length}\n`);

  for (const chunk of chunks) {
    console.log(`  ${chunk.type.toUpperCase()}: ${chunk.name}`);
    console.log(`    📍 Lines: ${chunk.startLine}-${chunk.endLine}`);
    console.log(`    🏷️  Keywords (first 5): ${chunk.keywords.slice(0, 5).join(', ')}`);
    console.log(`    💾 Size: ${chunk.code.length} chars`);

    if (chunk.context.dependencies.length > 0) {
      console.log(`    📦 Dependencies: ${chunk.context.dependencies.slice(0, 3).join(', ')}`);
    }

    console.log('');
  }
}

// Test with code file too
console.log('\n📄 File: test.ts (for comparison)');
console.log('─'.repeat(60));

const codeFile = {
  path: 'test.ts',
  content: `
export function hello() {
  return "world";
}
  `.trim(),
};

const codeChunks = chunkFile(codeFile.path, codeFile.content);
console.log(`  Should index: ${shouldIndex(codeFile.path) ? '✓ Yes' : '✗ No'}`);
console.log(`  Total chunks: ${codeChunks.length}`);

for (const chunk of codeChunks) {
  console.log(`\n  ${chunk.type.toUpperCase()}: ${chunk.name}`);
  console.log(`    📍 Lines: ${chunk.startLine}-${chunk.endLine}`);
}

// Overall stats
console.log('\n' + '='.repeat(60));
console.log('=== Overall Statistics ===\n');

const allChunks = testFiles.flatMap(f => chunkFile(f.path, f.content));
const stats = getChunkerStats(allChunks);

console.log(JSON.stringify(stats, null, 2));
console.log('\n=== Tests Complete ===');
