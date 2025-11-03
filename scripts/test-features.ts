/**
 * Test script for Features Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { featuresAgent } from '@/lib/agents/features';
import type { CodeChunk } from '@/lib/rag/types';

console.log('=== Testing Features Agent ===\n');

// Simulate code chunks from RAG
const codeChunks: CodeChunk[] = [
  {
    id: 'auth:1',
    filePath: 'src/auth/login.ts',
    startLine: 10,
    endLine: 25,
    type: 'function',
    name: 'login',
    language: 'typescript',
    code: `export async function login(email: string, password: string): Promise<User> {
  // Validate credentials
  const user = await db.users.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('Invalid credentials');
  }

  // Create session
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  await db.sessions.create({ userId: user.id, token });

  return user;
}`,
    context: {
      imports: ['bcrypt', 'jsonwebtoken'],
      exports: ['login'],
      calls: [],
      jsDoc: '/**\n * Authenticate user with email and password\n */',
      dependencies: ['bcrypt', 'jwt', 'database'],
    },
    keywords: ['login', 'authenticate', 'user'],
  },
  {
    id: 'users:1',
    filePath: 'src/users/create.ts',
    startLine: 5,
    endLine: 20,
    type: 'function',
    name: 'createUser',
    language: 'typescript',
    code: `export async function createUser(data: CreateUserData): Promise<User> {
  // Validate email
  const exists = await db.users.findOne({ email: data.email });
  if (exists) throw new Error('Email already registered');

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await db.users.create({
    email: data.email,
    name: data.name,
    passwordHash,
  });

  return user;
}`,
    context: {
      imports: ['bcrypt'],
      exports: ['createUser'],
      calls: [],
      jsDoc: '/**\n * Register a new user account\n */',
      dependencies: ['bcrypt', 'database'],
    },
    keywords: ['create', 'user', 'register'],
  },
  {
    id: 'todos:1',
    filePath: 'src/todos/manage.ts',
    startLine: 1,
    endLine: 30,
    type: 'class',
    name: 'TodoManager',
    language: 'typescript',
    code: `export class TodoManager {
  async createTodo(userId: string, text: string): Promise<Todo> {
    return await db.todos.create({ userId, text, completed: false });
  }

  async updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo> {
    return await db.todos.update(todoId, updates);
  }

  async deleteTodo(todoId: string): Promise<void> {
    await db.todos.delete(todoId);
  }

  async getTodos(userId: string, filter?: TodoFilter): Promise<Todo[]> {
    let query = db.todos.where({ userId });
    if (filter?.completed !== undefined) {
      query = query.where({ completed: filter.completed });
    }
    return await query.find();
  }
}`,
    context: {
      imports: [],
      exports: ['TodoManager'],
      calls: [],
      jsDoc: '/**\n * Manages todo items for users\n */',
      dependencies: ['database'],
    },
    keywords: ['todo', 'task', 'manage'],
  },
  {
    id: 'search:1',
    filePath: 'src/search/search.ts',
    startLine: 5,
    endLine: 15,
    type: 'function',
    name: 'searchTodos',
    language: 'typescript',
    code: `export async function searchTodos(
  userId: string,
  query: string
): Promise<Todo[]> {
  return await db.todos
    .where({ userId })
    .where('text', 'contains', query)
    .orderBy('createdAt', 'desc')
    .find();
}`,
    context: {
      imports: [],
      exports: ['searchTodos'],
      calls: [],
      jsDoc: '/**\n * Search todos by text content\n */',
      dependencies: ['database'],
    },
    keywords: ['search', 'find', 'todo'],
  },
];

const testInput = {
  repoName: 'awesome-todo-app',
  overview: 'A modern todo application with user authentication and task management',
  codeChunks,
  readme: `# Awesome Todo App

Manage your tasks efficiently with our modern todo application.

## What You Can Do

- Create an account and log in securely
- Add, edit, and delete your todos
- Mark tasks as complete
- Search through your todos
- Filter by completion status`,
};

async function runTest() {
  console.log(`Analyzing features for: ${testInput.repoName}\n`);
  console.log('Input summary:');
  console.log(`  Overview: ${testInput.overview}`);
  console.log(`  Code chunks: ${testInput.codeChunks.length}`);
  console.log(`  README: ${testInput.readme ? '✓ Provided' : '✗ Not provided'}`);
  console.log('\nRunning Features Agent...\n');

  try {
    const result = await featuresAgent.execute(testInput);

    console.log('=== Feature Detection Result ===\n');

    console.log(`Summary: ${result.summary}\n`);

    console.log(`Detected ${result.features.length} features:\n`);

    result.features.forEach((feature, idx) => {
      console.log(`${idx + 1}. ${feature.name} (${feature.category})`);
      console.log(`   Description: ${feature.description}`);
      console.log(`   Related code chunks: ${feature.relatedChunks.join(', ')}`);
      console.log('');
    });

    console.log('=== Test Complete ===');
    console.log('\n✓ Features Agent working!');
  } catch (error) {
    console.error('✗ Feature detection failed:', error);
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
