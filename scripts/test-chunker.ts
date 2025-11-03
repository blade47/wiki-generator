/**
 * Test script for semantic chunker
 */

import { parseFile } from '@/lib/rag/parser';
import { extractSemanticChunks, getChunkerStats } from '@/lib/rag/code-chunker';

// Test code samples with multiple constructs
const testFiles = [
  {
    path: 'test.ts',
    code: `
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
    return user;
  }

  private async findUser(username: string): Promise<User | null> {
    return database.query('SELECT * FROM users WHERE username = ?', [username]);
  }
}

/**
 * Hash a password securely
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

interface User {
  id: string;
  username: string;
  email: string;
}
    `.trim(),
  },
  {
    path: 'test.py',
    code: `
def calculate_total(items):
    """
    Calculate the total price of items
    """
    total = 0
    for item in items:
        total += item.price
    return total

class ShoppingCart:
    """Shopping cart manager"""

    def __init__(self):
        self.items = []

    def add_item(self, item):
        """Add an item to the cart"""
        self.items.append(item)
        return len(self.items)
    `.trim(),
  },
];

console.log('=== Testing Semantic Chunker ===\n');

for (const file of testFiles) {
  console.log(`\n📄 Processing: ${file.path}`);
  console.log('─'.repeat(60));

  const result = parseFile(file.path, file.code);

  if (!result) {
    console.log('  ✗ Failed to parse');
    continue;
  }

  const { tree, language } = result;
  const chunks = extractSemanticChunks(tree, file.path, file.code, language);

  console.log(`\n  Language: ${language}`);
  console.log(`  Total chunks: ${chunks.length}\n`);

  for (const chunk of chunks) {
    console.log(`  ${chunk.type.toUpperCase()}: ${chunk.name}`);
    console.log(`    📍 Lines: ${chunk.startLine}-${chunk.endLine}`);
    console.log(`    🏷️  Keywords: ${chunk.keywords.slice(0, 5).join(', ')}`);

    if (chunk.context.parentClass) {
      console.log(`    👪 Parent: ${chunk.context.parentClass}`);
    }

    if (chunk.context.jsDoc) {
      const docPreview = chunk.context.jsDoc.split('\n')[0].slice(0, 50);
      console.log(`    📝 Doc: ${docPreview}...`);
    }

    if (chunk.context.calls && chunk.context.calls.length > 0) {
      console.log(`    📞 Calls: ${chunk.context.calls.join(', ')}`);
    }

    console.log(`    💾 Size: ${chunk.code.length} chars`);
    console.log('');
  }

  // Verify line numbers are correct
  console.log('  ✓ Verifying line numbers...');
  for (const chunk of chunks) {
    const lines = file.code.split('\n');
    const extractedCode = lines.slice(chunk.startLine - 1, chunk.endLine).join('\n');

    if (extractedCode.includes(chunk.name)) {
      console.log(`    ✓ ${chunk.name}: Line numbers correct`);
    } else {
      console.log(`    ✗ ${chunk.name}: Line numbers might be off`);
    }
  }

  // Verify call extraction
  console.log('\n  ✓ Verifying call extraction...');
  const expectedCalls: Record<string, string[]> = {
    'login': ['findUser'],  // login() calls this.findUser()
    'findUser': ['query'],  // findUser() calls database.query()
    'hashPassword': ['hashSync'],  // hashPassword() calls bcrypt.hashSync()
    'add_item': ['append'],  // add_item() calls append()
  };

  for (const chunk of chunks) {
    const expected = expectedCalls[chunk.name];
    if (expected) {
      const hasExpectedCalls = expected.every(call =>
        chunk.context.calls.includes(call)
      );
      if (hasExpectedCalls) {
        console.log(`    ✓ ${chunk.name}: Extracted calls correctly (${chunk.context.calls.join(', ')})`);
      } else {
        console.log(`    ✗ ${chunk.name}: Expected [${expected.join(', ')}], got [${chunk.context.calls.join(', ')}]`);
      }
    }
  }
}

// Overall stats
console.log('\n' + '='.repeat(60));
console.log('=== Overall Statistics ===\n');

const allChunks = testFiles.flatMap(file => {
  const result = parseFile(file.path, file.code);
  if (!result) return [];
  return extractSemanticChunks(result.tree, file.path, file.code, result.language);
});

const stats = getChunkerStats(allChunks);
console.log(JSON.stringify(stats, null, 2));

console.log('\n=== Tests Complete ===');
