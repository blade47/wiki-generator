/**
 * Test script for HyDE Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { hydeAgent } from '@/lib/agents/hyde';

console.log('=== Testing HyDE Agent ===\n');

const testCases = [
  {
    query: 'How do I add authentication to my app?',
    repoContext: {
      name: 'awesome-todo-app',
      overview: 'A modern todo application with user authentication and task management',
      techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'JWT'],
    },
  },
  {
    query: 'How can users search for their todos?',
    repoContext: {
      name: 'awesome-todo-app',
      overview: 'A modern todo application with user authentication and task management',
      techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL'],
    },
  },
];

async function runTest() {
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}/${testCases.length}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Repository: ${testCase.repoContext.name}`);
    console.log(`Tech Stack: ${testCase.repoContext.techStack.join(', ')}\n`);

    try {
      const result = await hydeAgent.execute(testCase);

      console.log('=== HyDE Result ===\n');

      console.log(`Original Query: ${result.originalQuery}\n`);

      console.log('Expanded Queries:');
      result.expandedQueries.forEach((q, idx) => {
        console.log(`  ${idx + 1}. ${q}`);
      });
      console.log('');

      console.log('Hypothetical Code:');
      result.hypotheticalCode.forEach((code, idx) => {
        console.log(`  ${idx + 1}. ${code.description}`);
        console.log(`     \`\`\`\n${code.code.split('\n').map(l => `     ${l}`).join('\n')}\n     \`\`\``);
        console.log('');
      });

      console.log('Hypothetical Documentation:');
      result.hypotheticalDocs.forEach((doc, idx) => {
        console.log(`  ${idx + 1}. ${doc.title}`);
        console.log(`     ${doc.content.substring(0, 150)}...`);
        console.log('');
      });

      console.log('─'.repeat(70));
      console.log('');
    } catch (error) {
      console.error('✗ HyDE generation failed:', error);
      process.exit(1);
    }
  }

  console.log('=== All Tests Complete ===');
  console.log('\n✓ HyDE Agent working!');
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
