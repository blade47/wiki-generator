/**
 * Test script for CodeGraph
 */

import { CodeGraph } from '@/lib/rag/code-graph';
import type { CodeChunk } from '@/lib/rag/types';

// Create realistic authentication flow chunks
const chunks: CodeChunk[] = [
  {
    id: 'api/auth.ts:10',
    filePath: 'api/auth.ts',
    startLine: 10,
    endLine: 20,
    type: 'function',
    name: 'login',
    language: 'typescript',
    code: 'async function login(credentials) { ... }',
    context: {
      imports: [],
      exports: ['login'],
      calls: ['validateInput', 'findUser', 'comparePassword', 'generateToken'], // login calls these
      dependencies: [],
    },
    keywords: ['login', 'auth'],
  },
  {
    id: 'validators/auth.ts:5',
    filePath: 'validators/auth.ts',
    startLine: 5,
    endLine: 15,
    type: 'function',
    name: 'validateInput',
    language: 'typescript',
    code: 'function validateInput(data) { ... }',
    context: {
      imports: [],
      exports: ['validateInput'],
      calls: ['checkEmail', 'checkPassword'], // validateInput calls these
      dependencies: [],
    },
    keywords: ['validate'],
  },
  {
    id: 'validators/email.ts:3',
    filePath: 'validators/email.ts',
    startLine: 3,
    endLine: 10,
    type: 'function',
    name: 'checkEmail',
    language: 'typescript',
    code: 'function checkEmail(email) { ... }',
    context: {
      imports: [],
      exports: ['checkEmail'],
      calls: [], // leaf node - no calls
      dependencies: [],
    },
    keywords: ['email'],
  },
  {
    id: 'validators/password.ts:5',
    filePath: 'validators/password.ts',
    startLine: 5,
    endLine: 12,
    type: 'function',
    name: 'checkPassword',
    language: 'typescript',
    code: 'function checkPassword(pwd) { ... }',
    context: {
      imports: [],
      exports: ['checkPassword'],
      calls: [], // leaf node
      dependencies: [],
    },
    keywords: ['password'],
  },
  {
    id: 'db/users.ts:20',
    filePath: 'db/users.ts',
    startLine: 20,
    endLine: 30,
    type: 'function',
    name: 'findUser',
    language: 'typescript',
    code: 'async function findUser(email) { ... }',
    context: {
      imports: [],
      exports: ['findUser'],
      calls: ['query'], // findUser calls query
      dependencies: [],
    },
    keywords: ['user', 'database'],
  },
  {
    id: 'db/connection.ts:10',
    filePath: 'db/connection.ts',
    startLine: 10,
    endLine: 15,
    type: 'function',
    name: 'query',
    language: 'typescript',
    code: 'async function query(sql, params) { ... }',
    context: {
      imports: [],
      exports: ['query'],
      calls: [], // leaf node
      dependencies: [],
    },
    keywords: ['database', 'query'],
  },
  {
    id: 'auth/password.ts:8',
    filePath: 'auth/password.ts',
    startLine: 8,
    endLine: 15,
    type: 'function',
    name: 'comparePassword',
    language: 'typescript',
    code: 'async function comparePassword(plain, hash) { ... }',
    context: {
      imports: [],
      exports: ['comparePassword'],
      calls: ['compare'], // comparePassword calls bcrypt.compare
      dependencies: [],
    },
    keywords: ['password', 'hash'],
  },
  {
    id: 'auth/token.ts:5',
    filePath: 'auth/token.ts',
    startLine: 5,
    endLine: 12,
    type: 'function',
    name: 'generateToken',
    language: 'typescript',
    code: 'function generateToken(userId) { ... }',
    context: {
      imports: [],
      exports: ['generateToken'],
      calls: ['sign'], // generateToken calls jwt.sign
      dependencies: [],
    },
    keywords: ['token', 'jwt'],
  },
  // Unrelated chunk (should NOT appear in related)
  {
    id: 'utils/logger.ts:1',
    filePath: 'utils/logger.ts',
    startLine: 1,
    endLine: 5,
    type: 'function',
    name: 'log',
    language: 'typescript',
    code: 'function log(message) { ... }',
    context: {
      imports: [],
      exports: ['log'],
      calls: [],
      dependencies: [],
    },
    keywords: ['log'],
  },
];

console.log('=== Testing CodeGraph ===\n');

// Build graph
const graph = new CodeGraph(chunks);

console.log('📊 Graph Statistics:');
const stats = graph.getStats();
console.log(`  Total chunks: ${stats.totalChunks}`);
console.log(`  Chunks with calls: ${stats.chunksWithCalls}`);
console.log(`  Unique function names: ${stats.uniqueFunctionNames}`);
console.log(`  Total call edges: ${stats.totalCallEdges}\n`);

// Test 1: Find all code related to login()
console.log('🔍 Test 1: Find all code related to login()');
console.log('─'.repeat(60));

const related = graph.findRelated('api/auth.ts:10', 3);
console.log(`Found ${related.length} related chunks:\n`);

for (const chunk of related) {
  console.log(`  • ${chunk.name} (${chunk.filePath})`);
  if (chunk.context.calls.length > 0) {
    console.log(`    Calls: ${chunk.context.calls.join(', ')}`);
  }
}

// Verify expected chunks are found
const expectedNames = [
  'validateInput',
  'checkEmail',
  'checkPassword',
  'findUser',
  'query',
  'comparePassword',
  'generateToken',
];

const foundNames = related.map(c => c.name);
const allFound = expectedNames.every(name => foundNames.includes(name));
const noUnexpected = !foundNames.includes('log'); // log should NOT be found

if (allFound && noUnexpected) {
  console.log('\n✅ Test 1 PASSED: All expected chunks found, no unexpected ones');
} else {
  console.log('\n❌ Test 1 FAILED:');
  console.log(`  Expected: ${expectedNames.join(', ')}`);
  console.log(`  Found: ${foundNames.join(', ')}`);
}

// Test 2: Find who calls validateInput()
console.log('\n\n🔍 Test 2: Find who calls validateInput()');
console.log('─'.repeat(60));

const callers = graph.findCallers('validateInput');
console.log(`Found ${callers.length} callers:\n`);

for (const chunk of callers) {
  console.log(`  • ${chunk.name} (${chunk.filePath})`);
}

if (callers.length === 1 && callers[0].name === 'login') {
  console.log('\n✅ Test 2 PASSED: Correctly identified login() as the only caller');
} else {
  console.log('\n❌ Test 2 FAILED: Expected only login() as caller');
}

// Test 3: Find definitions of findUser()
console.log('\n\n🔍 Test 3: Find definitions of findUser()');
console.log('─'.repeat(60));

const definitions = graph.findDefinitions('findUser');
console.log(`Found ${definitions.length} definitions:\n`);

for (const chunk of definitions) {
  console.log(`  • ${chunk.name} in ${chunk.filePath}:${chunk.startLine}`);
}

if (definitions.length === 1 && definitions[0].filePath === 'db/users.ts') {
  console.log('\n✅ Test 3 PASSED: Correctly found findUser definition');
} else {
  console.log('\n❌ Test 3 FAILED: Expected 1 definition in db/users.ts');
}

// Test 4: Depth limiting
console.log('\n\n🔍 Test 4: Test depth limiting (depth=1)');
console.log('─'.repeat(60));

const depth1 = graph.findRelated('api/auth.ts:10', 1);
console.log(`Found ${depth1.length} chunks at depth 1:\n`);

for (const chunk of depth1) {
  console.log(`  • ${chunk.name}`);
}

// At depth 1, should only find direct calls of login()
const expectedDepth1 = ['validateInput', 'findUser', 'comparePassword', 'generateToken'];
const foundDepth1 = depth1.map(c => c.name);
const correctDepth = expectedDepth1.every(name => foundDepth1.includes(name)) &&
                     !foundDepth1.includes('checkEmail'); // depth 2

if (correctDepth && depth1.length === 4) {
  console.log('\n✅ Test 4 PASSED: Depth limiting works correctly');
} else {
  console.log('\n❌ Test 4 FAILED: Depth limiting not working');
  console.log(`  Expected 4 chunks: ${expectedDepth1.join(', ')}`);
  console.log(`  Found ${depth1.length} chunks: ${foundDepth1.join(', ')}`);
}

console.log('\n' + '='.repeat(60));
console.log('=== All Tests Complete ===\n');
