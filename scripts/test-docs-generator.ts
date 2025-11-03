/**
 * Test script for Docs Generator Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { docsGeneratorAgent } from '@/lib/agents/docs-generator';
import type { CodeChunk } from '@/lib/rag/types';
import type { Feature } from '@/lib/agents/features/types';

console.log('=== Testing Docs Generator Agent ===\n');

const feature: Feature = {
  name: 'User Authentication',
  description: 'Users can create accounts and log in securely to access their personal todo lists',
  category: 'Authentication & Authorization',
  relatedChunks: ['auth:1', 'auth:2', 'users:1'],
  importance: 10, // Optional - defaults to 5 if not provided
};

const codeChunks: CodeChunk[] = [
  {
    id: 'auth:1',
    filePath: 'src/auth/login.ts',
    startLine: 15,
    endLine: 30,
    type: 'function',
    name: 'login',
    language: 'typescript',
    code: `export async function login(email: string, password: string): Promise<AuthResult> {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = await db.users.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Create session token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user, token };
}`,
    context: {
      imports: ['bcrypt', 'jsonwebtoken'],
      exports: ['login'],
      calls: [],
      jsDoc: '/**\n * Authenticate user with email and password\n * @returns User object and JWT token\n */',
      dependencies: ['bcrypt', 'jwt', 'database'],
    },
    keywords: ['login', 'auth', 'authenticate'],
  },
  {
    id: 'users:1',
    filePath: 'src/users/register.ts',
    startLine: 10,
    endLine: 25,
    type: 'function',
    name: 'register',
    language: 'typescript',
    code: `export async function register(email: string, password: string, name: string): Promise<User> {
  // Validate email
  const exists = await db.users.findOne({ email });
  if (exists) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await db.users.create({
    email,
    name,
    passwordHash,
    createdAt: new Date(),
  });

  return user;
}`,
    context: {
      imports: ['bcrypt'],
      exports: ['register'],
      calls: [],
      jsDoc: '/**\n * Register a new user account\n * @returns Created user object\n */',
      dependencies: ['bcrypt', 'database'],
    },
    keywords: ['register', 'signup', 'create account'],
  },
];

const testInput = {
  feature,
  codeChunks,
  repoContext: {
    name: 'awesome-todo-app',
    overview: 'A modern todo application with user authentication and task management',
  },
};

async function runTest() {
  console.log(`Generating documentation for: ${feature.name}\n`);
  console.log('Input summary:');
  console.log(`  Feature: ${feature.name}`);
  console.log(`  Description: ${feature.description}`);
  console.log(`  Category: ${feature.category}`);
  console.log(`  Code chunks: ${codeChunks.length}`);
  console.log('\nRunning Docs Generator Agent...\n');

  try {
    const result = await docsGeneratorAgent.execute(testInput);

    console.log('=== Generated Documentation ===\n');

    console.log(`# ${result.title}\n`);
    console.log(`**Summary**: ${result.summary}\n`);
    console.log('---\n');
    console.log(result.content);
    console.log('\n---\n');

    console.log('## Code Examples\n');
    result.codeExamples.forEach((example, idx) => {
      console.log(`### ${idx + 1}. ${example.title}`);
      console.log(`${example.description}\n`);
      console.log(`**Source**: \`${example.sourceFile}:${example.lineNumber}\`\n`);
      console.log('```' + example.language);
      console.log(example.code);
      console.log('```\n');
    });

    if (result.relatedFeatures && result.relatedFeatures.length > 0) {
      console.log('## Related Features\n');
      result.relatedFeatures.forEach(f => {
        console.log(`- ${f}`);
      });
      console.log('');
    }

    console.log('=== Test Complete ===');
    console.log('\n✓ Docs Generator Agent working!');
  } catch (error) {
    console.error('✗ Documentation generation failed:', error);
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
