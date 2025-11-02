/**
 * Test script for Recon Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { reconAgent } from '@/lib/agents/recon';

console.log('=== Testing Recon Agent ===\n');

// Simulate a repository analysis
const testInput = {
  repoName: 'awesome-todo-app',
  readme: `# Awesome Todo App

A modern, fast, and beautiful todo application built with React and TypeScript.

## Features

- Create, edit, and delete todos
- Mark todos as complete
- Filter by status (all, active, completed)
- Dark mode support
- Offline-first with local storage

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\``,

  metadata: {
    'package.json': `{
  "name": "awesome-todo-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "tailwindcss": "^3.4.0"
  }
}`,
  },

  filePaths: [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.js',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'src/components/TodoList.tsx',
    'src/components/TodoItem.tsx',
    'src/components/AddTodo.tsx',
    'src/store/todoStore.ts',
    'src/hooks/useTodos.ts',
    'src/types/todo.ts',
    'src/utils/storage.ts',
    'src/styles/index.css',
    'tests/TodoList.test.tsx',
    'tests/TodoItem.test.tsx',
    'public/favicon.ico',
    'README.md',
  ],

  sampleFiles: [
    {
      path: 'src/main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    {
      path: 'src/store/todoStore.ts',
      content: `import { create } from 'zustand';
import type { Todo } from '../types/todo';

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: crypto.randomUUID(), text, completed: false }]
  })),
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  })),
  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter(t => t.id !== id)
  })),
}));`,
    },
  ],
};

async function runTest() {
  console.log(`Analyzing repository: ${testInput.repoName}\n`);
  console.log('Input summary:');
  console.log(`  README: ${testInput.readme ? '✓ Provided' : '✗ Not provided'}`);
  console.log(`  Metadata files: ${Object.keys(testInput.metadata || {}).length}`);
  console.log(`  File paths: ${testInput.filePaths.length}`);
  console.log(`  Sample files: ${testInput.sampleFiles?.length || 0}`);
  console.log('\nRunning Recon Agent...\n');

  try {
    const result = await reconAgent.execute(testInput);

    console.log('=== Reconnaissance Result ===\n');

    console.log('Overview:');
    console.log(`  ${result.overview}\n`);

    console.log('Tech Stack:');
    console.log(`  Languages: ${result.techStack.languages.join(', ')}`);
    console.log(`  Frameworks: ${result.techStack.frameworks.join(', ')}`);
    console.log(`  Tools: ${result.techStack.tools.join(', ')}\n`);

    console.log('Architecture:');
    console.log(`  Pattern: ${result.architecture.pattern}`);
    console.log(`  Description: ${result.architecture.description}\n`);

    console.log('Project Structure:');
    result.structure.forEach(dir => {
      console.log(`  ${dir.directory} - ${dir.purpose}`);
    });
    console.log('');

    console.log('Entry Points:');
    result.entryPoints.forEach(entry => {
      console.log(`  - ${entry}`);
    });
    console.log('');

    if (result.testing) {
      console.log(`Testing: ${result.testing}\n`);
    }

    if (result.deployment) {
      console.log(`Deployment: ${result.deployment}\n`);
    }

    console.log('=== Test Complete ===');
    console.log('\n✓ Recon Agent working!');
  } catch (error) {
    console.error('✗ Recon failed:', error);
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
