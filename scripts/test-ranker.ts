/**
 * Test script for Code Ranker Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { codeRankerAgent } from '@/lib/agents/code-ranker';
import type { CodeChunk } from '@/lib/rag/types';

console.log('=== Testing Code Ranker Agent ===\n');

// Test chunks
const chunks: CodeChunk[] = [
  {
    id: 'auth:1',
    filePath: 'src/auth/authentication.ts',
    startLine: 10,
    endLine: 25,
    type: 'method',
    name: 'login',
    language: 'typescript',
    code: `async login(username: string, password: string): Promise<User> {
  const user = await this.findUser(username);
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  return user;
}`,
    context: {
      imports: ['bcrypt'],
      exports: [],
      parentClass: 'AuthService',
      jsDoc: '/**\n * Authenticate user with credentials\n */',
      dependencies: ['bcrypt', 'database'],
    },
    keywords: ['login', 'authenticate', 'user', 'password'],
  },
  {
    id: 'auth:2',
    filePath: 'src/auth/authentication.ts',
    startLine: 27,
    endLine: 30,
    type: 'function',
    name: 'hashPassword',
    language: 'typescript',
    code: `export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}`,
    context: {
      imports: ['bcrypt'],
      exports: ['hashPassword'],
      dependencies: ['bcrypt'],
    },
    keywords: ['hash', 'password', 'bcrypt'],
  },
  {
    id: 'users:1',
    filePath: 'src/api/users.ts',
    startLine: 5,
    endLine: 20,
    type: 'function',
    name: 'createUser',
    language: 'typescript',
    code: `export async function createUser(req: Request): Promise<Response> {
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
}`,
    context: {
      imports: ['bcrypt', 'database'],
      exports: ['createUser'],
      jsDoc: '/**\n * User management API endpoint\n */',
      dependencies: ['bcrypt', 'database'],
    },
    keywords: ['create', 'user', 'register', 'signup'],
  },
];

// Test queries
const testCases = [
  {
    query: 'How do I authenticate a user with username and password?',
    description: 'Direct feature query',
    chunk: chunks[0], // login method
    expectedScore: 'High (8-10)',
  },
  {
    query: 'How do I authenticate a user with username and password?',
    description: 'Same query, different chunk',
    chunk: chunks[1], // hashPassword
    expectedScore: 'Medium (4-6)',
  },
  {
    query: 'How do I create a new user account?',
    description: 'Feature query',
    chunk: chunks[2], // createUser
    expectedScore: 'High (8-10)',
  },
  {
    query: 'bcrypt password hashing implementation',
    description: 'Implementation-specific query',
    chunk: chunks[1], // hashPassword
    expectedScore: 'High (8-10)',
  },
];

async function runTest() {
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const { query, description, chunk, expectedScore } = testCase;

    console.log('─'.repeat(60));
    console.log(`Test ${i + 1}/${testCases.length}`);
    console.log(`Query: "${query}"`);
    console.log(`Description: ${description}`);
    console.log(`Chunk: ${chunk.type} "${chunk.name}" (${chunk.filePath})`);
    console.log(`Expected: ${expectedScore}\n`);

    try {
      const result = await codeRankerAgent.execute({
        query,
        chunk,
      });

      console.log(`Score: ${result.score}/10`);
      console.log(`  Relevance: ${result.relevance}/4`);
      console.log(`  Completeness: ${result.completeness}/3`);
      console.log(`  Quality: ${result.quality}/3`);
      console.log(`\nExplanation: ${result.explanation}`);
      console.log('');
    } catch (error) {
      console.error('✗ Ranking failed:', error);
      process.exit(1);
    }
  }

  console.log('─'.repeat(60));
  console.log('\n=== Test Complete ===');
  console.log('\n✓ Code Ranker Agent working!');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
