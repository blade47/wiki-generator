/**
 * Test script for Q&A Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { qaAgent } from '@/lib/agents/qa';
import type { CodeChunk } from '@/lib/rag/types';

console.log('=== Testing Q&A Agent ===\n');

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
  const user = await db.users.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user, token };
}`,
    context: {
      imports: ['bcrypt', 'jsonwebtoken'],
      exports: ['login'],
      jsDoc: '/**\n * Authenticate user with email and password\n */',
      dependencies: ['bcrypt', 'jwt', 'database'],
    },
    keywords: ['login', 'auth'],
  },
  {
    id: 'todos:1',
    filePath: 'src/todos/create.ts',
    startLine: 10,
    endLine: 20,
    type: 'function',
    name: 'createTodo',
    language: 'typescript',
    code: `export async function createTodo(userId: string, text: string): Promise<Todo> {
  if (!text || text.trim().length === 0) {
    throw new Error('Todo text is required');
  }

  const todo = await db.todos.create({
    userId,
    text: text.trim(),
    completed: false,
    createdAt: new Date(),
  });

  return todo;
}`,
    context: {
      imports: [],
      exports: ['createTodo'],
      jsDoc: '/**\n * Create a new todo for a user\n */',
      dependencies: ['database'],
    },
    keywords: ['todo', 'create', 'add'],
  },
];

const testQuestions = [
  {
    question: 'How do users log in to the app?',
    expectedConfidence: 'high',
  },
  {
    question: 'How can I create a new todo?',
    expectedConfidence: 'high',
  },
  {
    question: 'Can users reset their password?',
    expectedConfidence: 'low',
  },
];

async function runTest() {
  for (let i = 0; i < testQuestions.length; i++) {
    const { question, expectedConfidence } = testQuestions[i];

    console.log('─'.repeat(70));
    console.log(`Question ${i + 1}/${testQuestions.length}: "${question}"`);
    console.log(`Expected Confidence: ${expectedConfidence}\n`);

    try {
      const result = await qaAgent.execute({
        question,
        codeChunks,
        repoContext: {
          name: 'awesome-todo-app',
          overview: 'A modern todo application with user authentication',
        },
      });

      console.log('Answer:');
      console.log(`  ${result.answer}\n`);

      console.log('Code References:');
      if (result.codeReferences.length === 0) {
        console.log('  None\n');
      } else {
        result.codeReferences.forEach((ref, idx) => {
          console.log(`  ${idx + 1}. ${ref.file}:${ref.lineNumber}`);
          console.log(`     ${ref.description}`);
          console.log(`     Code snippet: ${ref.code.substring(0, 80)}...`);
          console.log('');
        });
      }

      if (result.relatedDocs && result.relatedDocs.length > 0) {
        console.log('Related Documentation:');
        result.relatedDocs.forEach(doc => {
          console.log(`  - ${doc}`);
        });
        console.log('');
      }

      console.log(`Confidence: ${result.confidence}`);
      console.log(`Reason: ${result.confidenceReason}\n`);
    } catch (error) {
      console.error('✗ Q&A failed:', error);
      process.exit(1);
    }
  }

  console.log('─'.repeat(70));
  console.log('\n=== All Tests Complete ===');
  console.log('\n✓ Q&A Agent working!');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
