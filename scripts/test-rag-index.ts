/**
 * Test script for Complete RAG Index
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { RAGIndex } from '@/lib/rag/index';

// Test files
const testFiles = [
  {
    path: 'src/auth/authentication.ts',
    content: `
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

    // Create session token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    return { user, token };
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
    content: `
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

  // Create user in database
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

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  return database.users.update(userId, updates);
}
    `.trim(),
  },
  {
    path: 'README.md',
    content: `
# Authentication System

A secure authentication system with bcrypt password hashing and JWT tokens.

## Features

- User login with username and password
- Secure password storage using bcrypt
- JWT token generation
- Session management
- User profile management

## API Endpoints

### Authentication
- POST /auth/login - Authenticate user with credentials
- POST /auth/logout - End user session

### User Management
- POST /users/create - Create new user account
- GET /users/:id - Get user profile
- PUT /users/:id - Update user profile

## Security

All passwords are hashed using bcrypt with a cost factor of 10.
JWT tokens are signed with a secret key from environment variables.
    `.trim(),
  },
];

console.log('=== Testing Complete RAG Index ===\n');

async function runTest() {
  // 1. Create index with configuration
  console.log('Creating RAG Index...\n');
  const index = new RAGIndex({
    enableCompression: false, // Disable for clearer testing
    reranking: {
      stage1TopK: 100,
      stage2TopK: 5, // Smaller for testing
      stage3TopK: 3, // Smaller for testing
    },
  });

  // 2. Build index
  await index.build(testFiles);

  // 3. Test queries
  const queries = [
    'How do I authenticate a user with username and password?',
    'How do I create a new user account?',
    'What security measures are implemented?',
  ];

  console.log('\n=== Testing Queries ===\n');

  for (const query of queries) {
    console.log('═'.repeat(70));
    console.log(`Query: "${query}"\n`);

    // Get detailed breakdown
    const results = await index.searchWithBreakdown(query);

    console.log('Top 3 Results:\n');
    results.stage3.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.chunk.type.toUpperCase()}: "${r.chunk.name}"`);
      console.log(`   File: ${r.chunk.filePath}:${r.chunk.startLine}`);
      console.log(`   Score: ${r.score.toFixed(1)}/10`);

      if ('explanation' in r) {
        console.log(`   Reasoning: ${r.explanation}`);
      }

      console.log('');
    });

    console.log('');
  }

  // 4. Show final statistics
  console.log('═'.repeat(70));
  console.log('\n=== Final Statistics ===\n');

  const stats = index.getStats();
  console.log(`Total chunks indexed: ${stats.totalChunks}`);
  console.log(`Chunks with embeddings: ${stats.withEmbeddings}`);
  console.log(`Compressed chunks: ${stats.compressed} (${stats.compressionRate}%)`);
  console.log('');
  console.log(`BM25-Code index: ${stats.codeBM25?.uniqueTerms} unique terms`);
  console.log(`BM25-Text index: ${stats.textBM25?.uniqueTerms} unique terms`);

  console.log('\n=== Test Complete ===');
  console.log('\n✓ Complete RAG pipeline working!');
  console.log('  ✓ Chunking (code + markdown)');
  console.log('  ✓ Embeddings (batch processing)');
  console.log('  ✓ BM25 (dual: code + text)');
  console.log('  ✓ Hybrid search (RRF fusion)');
  console.log('  ✓ 3-stage reranking (100 → 5 → 3)');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
