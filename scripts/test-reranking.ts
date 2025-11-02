/**
 * Test script for 3-Stage Reranking Pipeline
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { chunkFile } from '@/lib/rag/chunker';
import { embedChunks, generateEmbedding } from '@/lib/rag/embedder';
import { createCodeBM25, createTextBM25 } from '@/lib/rag/bm25';
import { HybridSearch } from '@/lib/rag/hybrid-search';
import { rerankResults, analyzeReranking } from '@/lib/rag/reranking';
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

  if (!username || !email || !password) {
    return new Response('Missing required fields', { status: 400 });
  }

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

console.log('=== Testing 3-Stage Reranking Pipeline ===\n');

async function runTest() {
  // 1. Setup
  console.log('Step 1: Setting up search index...');
  const allChunks: CodeChunk[] = testFiles.flatMap(file =>
    chunkFile(file.path, file.code)
  );
  console.log(`  ✓ Chunked ${allChunks.length} chunks`);

  const chunksWithEmbeddings = await embedChunks(allChunks);
  console.log(`  ✓ Generated embeddings\n`);

  const codeBM25 = createCodeBM25(chunksWithEmbeddings);
  const textBM25 = createTextBM25(chunksWithEmbeddings);

  const hybridSearch = new HybridSearch(
    chunksWithEmbeddings,
    codeBM25,
    textBM25
  );
  console.log('  ✓ Hybrid search ready\n');

  // 2. Test query
  const query = 'How do I authenticate a user with username and password?';
  console.log(`Query: "${query}"\n`);

  // 3. Generate query embedding
  console.log('Step 2: Generating query embedding...');
  const queryEmbedding = await generateEmbedding(query);
  console.log('  ✓ Query embedding ready\n');

  // 4. Stage 1: Hybrid search
  console.log('Step 3: Running hybrid search...');
  const hybridResults = await hybridSearch.search(query, queryEmbedding, 100);
  console.log(`  ✓ Got ${hybridResults.length} candidates\n`);

  // 5. 3-Stage Reranking
  console.log('Step 4: Running 3-stage reranking...');
  const { stage1, stage2, stage3 } = await rerankResults(
    query,
    queryEmbedding,
    hybridResults,
    {
      stage2TopK: 5, // Smaller for testing
      stage3TopK: 3, // Smaller for testing
    }
  );

  // 6. Show results
  console.log('=== Stage 1: Hybrid Search ===');
  console.log(`Top 5 candidates:\n`);
  stage1.slice(0, 5).forEach((r, idx) => {
    console.log(
      `${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath}`
    );
    console.log(`   RRF Score: ${r.score.toFixed(4)}`);
  });

  console.log('\n=== Stage 2: Embedding Rerank ===');
  console.log(`Top 5 candidates:\n`);
  stage2.forEach((r, idx) => {
    console.log(
      `${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath}`
    );
    console.log(`   Cosine Similarity: ${r.score.toFixed(4)}`);
  });

  console.log('\n=== Stage 3: LLM Rerank ===');
  console.log(`Final top 3 results:\n`);
  stage3.forEach((r, idx) => {
    console.log(
      `${idx + 1}. ${r.chunk.type} "${r.chunk.name}" - ${r.chunk.filePath}`
    );
    console.log(`   LLM Score: ${r.score.toFixed(1)}/10`);
    if ('explanation' in r) {
      console.log(`   Explanation: ${r.explanation}`);
    }
    console.log('');
  });

  // 7. Analysis
  const analysis = analyzeReranking(stage1, stage2, stage3);
  console.log('=== Reranking Analysis ===\n');
  console.log(`Stage 1 (Hybrid): ${analysis.stage1Count} candidates`);
  console.log(`Stage 2 (Embedding): ${analysis.stage2Count} candidates`);
  console.log(`Stage 3 (LLM): ${analysis.stage3Count} final results`);
  console.log(`\nFinal top result: ${analysis.finalTopChunk.type} "${analysis.finalTopChunk.name}"`);
  console.log(`  File: ${analysis.finalTopChunk.filePath}`);

  console.log('\n=== Test Complete ===');
  console.log('\n✓ 3-stage reranking pipeline working!');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
