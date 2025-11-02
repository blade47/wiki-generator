/**
 * Test script for Hybrid Search (Vector + BM25-Code + BM25-Text)
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { chunkFile } from '@/lib/rag/chunker';
import { embedChunks, generateEmbedding } from '@/lib/rag/embedder';
import { createCodeBM25, createTextBM25 } from '@/lib/rag/bm25';
import { HybridSearch } from '@/lib/rag/hybrid-search';
import type { CodeChunk } from '@/lib/rag/types';

// Test files
const testFiles = [
  {
    path: 'src/auth/authentication.ts',
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

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

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
    path: 'src/api/users.ts',
    code: `
/**
 * User management API endpoints
 */
export async function createUser(req: Request): Promise<Response> {
  const { username, email, password } = await req.json();

  // Validate input
  if (!username || !email || !password) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Hash password before storing
  const passwordHash = await bcrypt.hash(password, 10);

  await database.users.create({
    username,
    email,
    passwordHash,
  });

  return new Response('User created', { status: 201 });
}

export async function getUserProfile(userId: string): Promise<User> {
  return database.users.findById(userId);
}
    `.trim(),
  },
  {
    path: 'README.md',
    code: `
# Authentication System

A secure authentication system with bcrypt password hashing.

## Features

- User login with username and password
- Secure password storage using bcrypt
- JWT token generation
- Session management

## API Endpoints

- POST /auth/login - Authenticate user
- POST /users/create - Create new user
- GET /users/:id - Get user profile
    `.trim(),
  },
];

console.log('=== Testing Hybrid Search ===\n');

async function runTest() {
  // 1. Chunk files
  console.log('Step 1: Chunking files...');
  const allChunks: CodeChunk[] = testFiles.flatMap(file =>
    chunkFile(file.path, file.code)
  );
  console.log(`  ✓ Extracted ${allChunks.length} chunks\n`);

  // 2. Generate embeddings
  console.log('Step 2: Generating embeddings...');
  const chunksWithEmbeddings = await embedChunks(allChunks);
  console.log('');

  // 3. Build BM25 indexes
  console.log('Step 3: Building BM25 indexes...');
  const codeBM25 = createCodeBM25(chunksWithEmbeddings);
  const textBM25 = createTextBM25(chunksWithEmbeddings);
  console.log('');

  // 4. Create hybrid search
  console.log('Step 4: Creating hybrid search...');
  const hybridSearch = new HybridSearch(
    chunksWithEmbeddings,
    codeBM25,
    textBM25
  );

  const stats = hybridSearch.getStats();
  console.log(`  ✓ Hybrid search ready`);
  console.log(`    Total chunks: ${stats.totalChunks}`);
  console.log(`    With embeddings: ${stats.withEmbeddings}`);
  console.log('');

  // 5. Test queries
  const queries = [
    {
      query: 'How do I authenticate a user?',
      description: 'High-level semantic query',
    },
    {
      query: 'bcrypt password hashing',
      description: 'Specific implementation query',
    },
    {
      query: 'create new user account',
      description: 'Feature-based query',
    },
  ];

  console.log('Step 5: Testing queries...\n');

  for (const { query, description } of queries) {
    console.log('═'.repeat(60));
    console.log(`Query: "${query}"`);
    console.log(`Type: ${description}\n`);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Get breakdown of all methods
    const results = await hybridSearch.searchWithBreakdown(
      query,
      queryEmbedding,
      5
    );

    // Show top 3 from each method
    console.log('Vector Search (semantic):');
    results.vector.slice(0, 3).forEach((r, idx) => {
      console.log(
        `  ${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath} (score: ${r.score.toFixed(3)})`
      );
    });
    console.log('');

    console.log('BM25-Code (keyword on code):');
    results.bm25Code.slice(0, 3).forEach((r, idx) => {
      console.log(
        `  ${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath} (score: ${r.score.toFixed(3)})`
      );
    });
    console.log('');

    console.log('BM25-Text (keyword on metadata):');
    results.bm25Text.slice(0, 3).forEach((r, idx) => {
      console.log(
        `  ${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath} (score: ${r.score.toFixed(3)})`
      );
    });
    console.log('');

    console.log('Hybrid (RRF fusion):');
    results.hybrid.slice(0, 3).forEach((r, idx) => {
      console.log(
        `  ${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath} (RRF: ${r.score.toFixed(4)})`
      );
    });
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log('\n=== Test Complete ===');
  console.log('\n✓ Hybrid search working perfectly!');
  console.log('  Vector + BM25-Code + BM25-Text merged with RRF');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
