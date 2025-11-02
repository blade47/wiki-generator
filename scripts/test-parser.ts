/**
 * Test script for multi-language parser
 */

import { parseFile, detectLanguage, isSupported, getParserStats } from '@/lib/rag/parser';

// Test code samples
const testFiles = [
  {
    path: 'test.js',
    code: `
function hello() {
  return "world";
}

const greet = (name) => {
  return \`Hello, \${name}!\`;
};
    `.trim(),
  },
  {
    path: 'test.ts',
    code: `
interface User {
  name: string;
  age: number;
}

function getUserName(user: User): string {
  return user.name;
}
    `.trim(),
  },
  {
    path: 'test.py',
    code: `
def hello():
    """Say hello"""
    return "world"

class User:
    def __init__(self, name):
        self.name = name
    `.trim(),
  },
  {
    path: 'test.go',
    code: `
package main

func Hello() string {
    return "world"
}
    `.trim(),
  },
  {
    path: 'test.rs',
    code: `
fn hello() -> String {
    String::from("world")
}

pub struct User {
    name: String,
}
    `.trim(),
  },
];

console.log('=== Parser Stats ===');
console.log(JSON.stringify(getParserStats(), null, 2));
console.log('');

console.log('=== Testing Language Detection ===');
for (const file of testFiles) {
  const lang = detectLanguage(file.path);
  const supported = isSupported(file.path);
  console.log(`${file.path} → ${lang} (supported: ${supported})`);
}
console.log('');

console.log('=== Testing Parsing ===');
for (const file of testFiles) {
  console.log(`\nParsing ${file.path}...`);

  const result = parseFile(file.path, file.code);

  if (result) {
    const { tree, language } = result;
    console.log(`  ✓ Language: ${language}`);
    console.log(`  ✓ Root node: ${tree.rootNode.type}`);
    console.log(`  ✓ Child count: ${tree.rootNode.childCount}`);
    console.log(`  ✓ AST preview: ${tree.rootNode.toString().slice(0, 100)}...`);
  } else {
    console.log(`  ✗ Failed to parse`);
  }
}

console.log('\n=== All Tests Complete ===');
