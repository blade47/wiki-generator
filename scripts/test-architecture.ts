/**
 * Test script for Architecture Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { architectureAgent } from '@/lib/agents/architecture';
import type { CodeChunk } from '@/lib/rag/types';

console.log('=== Testing Architecture Agent ===\n');

const codeChunks: CodeChunk[] = [
  {
    id: 'app:1',
    filePath: 'src/App.tsx',
    startLine: 1,
    endLine: 15,
    type: 'component',
    name: 'App',
    language: 'typescript',
    code: `export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}`,
    context: {
      imports: ['React', 'Router'],
      exports: ['App'],
      dependencies: ['react-router-dom'],
    },
    keywords: ['app', 'router', 'layout'],
  },
  {
    id: 'store:1',
    filePath: 'src/store/todoStore.ts',
    startLine: 1,
    endLine: 20,
    type: 'constant',
    name: 'useTodoStore',
    language: 'typescript',
    code: `export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  addTodo: (text) => {
    set((state) => ({
      todos: [...state.todos, { id: uuid(), text, completed: false }]
    }));
  },
  toggleTodo: (id) => {
    set((state) => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  },
}));`,
    context: {
      imports: ['zustand'],
      exports: ['useTodoStore'],
      dependencies: ['zustand'],
    },
    keywords: ['store', 'state', 'zustand'],
  },
  {
    id: 'api:1',
    filePath: 'src/api/todos.ts',
    startLine: 1,
    endLine: 10,
    type: 'function',
    name: 'getTodos',
    language: 'typescript',
    code: `export async function getTodos(userId: string): Promise<Todo[]> {
  const response = await fetch(\`/api/users/\${userId}/todos\`);
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json();
}`,
    context: {
      imports: [],
      exports: ['getTodos'],
      jsDoc: '/**\n * Fetch todos from API\n */',
      dependencies: [],
    },
    keywords: ['api', 'fetch', 'todos'],
  },
];

const testInput = {
  repoOverview: 'A modern todo application with user authentication and task management',
  architecturePattern: {
    pattern: 'Component-Based',
    description: 'React components with Zustand state management and RESTful API',
  },
  codeChunks,
  directories: [
    { directory: 'src/components/', purpose: 'Reusable UI components' },
    { directory: 'src/pages/', purpose: 'Page-level components for routing' },
    { directory: 'src/store/', purpose: 'Zustand state management stores' },
    { directory: 'src/api/', purpose: 'API client functions' },
    { directory: 'src/hooks/', purpose: 'Custom React hooks' },
  ],
};

async function runTest() {
  console.log('Analyzing architecture...\n');

  try {
    const result = await architectureAgent.execute(testInput);

    console.log('=== Architecture Analysis ===\n');

    console.log('Overview:');
    console.log(`  ${result.overview}\n`);

    if (result.componentHierarchy) {
      console.log('Component Hierarchy:');
      console.log(`  ${result.componentHierarchy.description}`);
      result.componentHierarchy.structure.forEach(s => {
        console.log(`  - ${s}`);
      });
      console.log('');
    }

    console.log('Data Flow:');
    console.log(`  ${result.dataFlow.description}\n`);
    result.dataFlow.steps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step.step}`);
      console.log(`     ${step.description}`);
    });
    console.log('');

    if (result.apiStructure) {
      console.log('API Structure:');
      console.log(`  ${result.apiStructure.description}`);
      result.apiStructure.endpoints.forEach(endpoint => {
        console.log(`  - ${endpoint}`);
      });
      console.log('');
    }

    console.log('Architectural Patterns:');
    result.patterns.forEach((pattern, idx) => {
      console.log(`  ${idx + 1}. ${pattern.pattern}`);
      console.log(`     Usage: ${pattern.usage}`);
      console.log(`     Example: ${pattern.example}`);
      console.log('');
    });

    console.log('=== Test Complete ===');
    console.log('\n✓ Architecture Agent working!');
  } catch (error) {
    console.error('✗ Architecture analysis failed:', error);
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
