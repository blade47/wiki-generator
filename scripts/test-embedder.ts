/**
 * Test script for Embeddings System
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { chunkFile } from '@/lib/rag/chunker';
import {
  embedChunks,
  validateEmbeddings,
  createEmbeddingText,
  EMBEDDING_DIMENSIONS,
} from '@/lib/rag/embedder';

// Test files
const testFiles = [
  {
    path: 'test.ts',
    code: `
/**
 * User authentication service
 */
export class AuthService {
  /**
   * Authenticate user with credentials
   */
  async login(username: string, password: string): Promise<User> {
    const user = await this.findUser(username);
    if (!user) throw new Error('User not found');
    return user;
  }

  private async findUser(username: string): Promise<User | null> {
    return database.query('SELECT * FROM users WHERE username = ?', [username]);
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
    `.trim(),
  },
  {
    path: 'README.md',
    code: `
# Awesome Project

A revolutionary tool for developers.

## Features

- Fast
- Simple
- Powerful

## Installation

\`\`\`bash
npm install awesome-project
\`\`\`
    `.trim(),
  },
];

console.log('=== Testing Embeddings System ===\n');

async function runTest() {
  // 1. Chunk the files
  console.log('Step 1: Chunking files...');
  const allChunks = testFiles.flatMap(file => chunkFile(file.path, file.code));
  console.log(`  ✓ Extracted ${allChunks.length} chunks\n`);

  // 2. Show embedding text preview
  console.log('Step 2: Preview embedding text...');
  const firstChunk = allChunks[0];
  const embeddingText = createEmbeddingText(firstChunk);
  console.log(`  Chunk: ${firstChunk.type} "${firstChunk.name}"`);
  console.log(`  Embedding text preview (first 200 chars):`);
  console.log(`    ${embeddingText.slice(0, 200)}...`);
  console.log('');

  // 3. Generate embeddings
  console.log('Step 3: Generating embeddings...\n');
  const startTime = Date.now();

  const chunksWithEmbeddings = await embedChunks(allChunks);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n  ⏱️  Completed in ${duration}s\n`);

  // 4. Validate embeddings
  console.log('Step 4: Validating embeddings...');
  const validation = validateEmbeddings(chunksWithEmbeddings);

  console.log(`  Total chunks: ${validation.stats.total}`);
  console.log(`  With embeddings: ${validation.stats.withEmbeddings}`);
  console.log(`  Without embeddings: ${validation.stats.withoutEmbeddings}`);
  console.log(`  Invalid dimensions: ${validation.stats.invalidDimensions}`);
  console.log(`  Validation: ${validation.valid ? '✓ PASS' : '✗ FAIL'}\n`);

  // 5. Show embedding details
  console.log('Step 5: Embedding details...');
  for (const chunk of chunksWithEmbeddings.slice(0, 3)) {
    console.log(`\n  ${chunk.type.toUpperCase()}: ${chunk.name}`);
    console.log(`    File: ${chunk.filePath}`);
    console.log(`    Embedding dimensions: ${chunk.embedding?.length || 0}`);
    console.log(`    Expected dimensions: ${EMBEDDING_DIMENSIONS}`);

    if (chunk.embedding) {
      console.log(`    First 5 values: [${chunk.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      // Calculate magnitude (useful for debugging)
      const magnitude = Math.sqrt(
        chunk.embedding.reduce((sum, val) => sum + val * val, 0)
      );
      console.log(`    Magnitude: ${magnitude.toFixed(4)}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('=== Test Complete ===');

  if (!validation.valid) {
    console.error('\n✗ Validation failed!');
    process.exit(1);
  }

  console.log('\n✓ All tests passed!');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
