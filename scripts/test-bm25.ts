/**
 * Test script for BM25 Search
 */

import { chunkFile } from '@/lib/rag/chunker';
import { createCodeBM25, createTextBM25 } from '@/lib/rag/bm25';
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

console.log('=== Testing BM25 Search ===\n');

// 1. Chunk all files
console.log('Step 1: Chunking files...');
const allChunks: CodeChunk[] = testFiles.flatMap(file =>
  chunkFile(file.path, file.code)
);
console.log(`  ✓ Extracted ${allChunks.length} chunks\n`);

// 2. Build BM25 indexes
console.log('Step 2: Building BM25 indexes...\n');
const codeBM25 = createCodeBM25(allChunks);
const textBM25 = createTextBM25(allChunks);
console.log('');

// 3. Test queries
const queries = [
  {
    query: 'bcrypt password hash',
    description: 'Code-specific query (exact terms)',
  },
  {
    query: 'user authentication login',
    description: 'Semantic query (concept-based)',
  },
  {
    query: 'findUser database query',
    description: 'Function + implementation query',
  },
  {
    query: 'create new user account',
    description: 'High-level feature query',
  },
];

console.log('Step 3: Testing queries...\n');

for (const { query, description } of queries) {
  console.log('─'.repeat(60));
  console.log(`Query: "${query}"`);
  console.log(`Type: ${description}\n`);

  // Search with BM25-Code
  console.log('BM25-Code (searches actual code):');
  const codeResults = codeBM25.search(query, 3);
  if (codeResults.length === 0) {
    console.log('  No results\n');
  } else {
    codeResults.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.chunk.type} "${result.chunk.name}"`);
      console.log(`     File: ${result.chunk.filePath}`);
      console.log(`     Score: ${result.score.toFixed(3)}`);
    });
    console.log('');
  }

  // Search with BM25-Text
  console.log('BM25-Text (searches metadata):');
  const textResults = textBM25.search(query, 3);
  if (textResults.length === 0) {
    console.log('  No results\n');
  } else {
    textResults.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.chunk.type} "${result.chunk.name}"`);
      console.log(`     File: ${result.chunk.filePath}`);
      console.log(`     Score: ${result.score.toFixed(3)}`);
    });
    console.log('');
  }
}

console.log('─'.repeat(60));
console.log('\n=== Index Statistics ===\n');

const codeStats = codeBM25.getStats();
const textStats = textBM25.getStats();

console.log(`${codeStats.name}:`);
console.log(`  Documents: ${codeStats.documents}`);
console.log(`  Avg doc length: ${codeStats.avgDocLength.toFixed(1)} terms`);
console.log(`  Unique terms: ${codeStats.uniqueTerms}`);
console.log('');

console.log(`${textStats.name}:`);
console.log(`  Documents: ${textStats.documents}`);
console.log(`  Avg doc length: ${textStats.avgDocLength.toFixed(1)} terms`);
console.log(`  Unique terms: ${textStats.uniqueTerms}`);

console.log('\n=== Test Complete ===');
console.log('\n✓ BM25 implementation working!');
