/**
 * Test script for Code Summarizer Agent
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { codeSummarizerAgent } from '@/lib/agents/code-summarizer';
import type { CodeChunk } from '@/lib/rag/types';

// Test with a large code chunk
const largeChunk: CodeChunk = {
  id: 'test.ts:1',
  filePath: 'src/auth/authentication.ts',
  startLine: 1,
  endLine: 50,
  type: 'function',
  name: 'authenticateUser',
  language: 'typescript',
  code: `
/**
 * Authenticate a user with username and password
 * This function performs several security checks:
 * 1. Validates username format
 * 2. Checks password strength
 * 3. Verifies against database
 * 4. Creates session token
 * 5. Logs authentication attempt
 *
 * @param username - The username to authenticate
 * @param password - The user's password
 * @returns Authentication result with user data and token
 * @throws AuthenticationError if credentials are invalid
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthenticationResult> {
  // Validate username format
  if (!username || username.length < 3) {
    throw new AuthenticationError('Username must be at least 3 characters');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new AuthenticationError('Username can only contain letters, numbers, and underscores');
  }

  // Check password strength
  if (!password || password.length < 8) {
    throw new AuthenticationError('Password must be at least 8 characters');
  }

  // Find user in database
  const user = await database.users.findOne({ username });

  if (!user) {
    // Log failed attempt for security monitoring
    await logAuthenticationAttempt({
      username,
      success: false,
      reason: 'user_not_found',
      timestamp: new Date(),
    });
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password hash
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    // Log failed attempt
    await logAuthenticationAttempt({
      username,
      success: false,
      reason: 'invalid_password',
      timestamp: new Date(),
    });
    throw new AuthenticationError('Invalid credentials');
  }

  // Create session token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  // Update last login time
  await database.users.updateOne(
    { _id: user.id },
    { $set: { lastLogin: new Date() } }
  );

  // Log successful authentication
  await logAuthenticationAttempt({
    username,
    success: true,
    timestamp: new Date(),
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
  };
}
  `.trim(),
  context: {
    imports: ['bcrypt', 'jsonwebtoken', 'database'],
    exports: ['authenticateUser'],
      calls: [],
    dependencies: ['bcrypt', 'jwt', 'database'],
  },
  keywords: ['authenticate', 'user', 'auth', 'login'],
};

console.log('=== Testing Code Summarizer Agent ===\n');

console.log(`Original Code:`);
console.log(`  File: ${largeChunk.filePath}`);
console.log(`  Function: ${largeChunk.name}`);
console.log(`  Size: ${largeChunk.code.length} characters`);
console.log(`  Lines: ${largeChunk.startLine}-${largeChunk.endLine}\n`);

console.log('Compressing with AI...\n');

codeSummarizerAgent
  .execute({ chunk: largeChunk, targetSize: 500 })
  .then(result => {
    console.log('=== Compression Result ===\n');

    console.log(`Purpose:`);
    console.log(`  ${result.purpose}\n`);

    console.log(`Key Components:`);
    result.keyComponents.forEach(comp => console.log(`  - ${comp}`));
    console.log('');

    console.log(`Dependencies:`);
    result.dependencies.forEach(dep => console.log(`  - ${dep}`));
    console.log('');

    console.log(`Compressed Code (${result.compressed.length} chars):`);
    console.log('─'.repeat(60));
    console.log(result.compressed);
    console.log('─'.repeat(60));
    console.log('');

    const reduction = Math.round(
      ((largeChunk.code.length - result.compressed.length) / largeChunk.code.length) * 100
    );
    console.log(`\n✓ Size reduced by ${reduction}%`);
    console.log(`  Original: ${largeChunk.code.length} chars`);
    console.log(`  Compressed: ${result.compressed.length} chars`);

    console.log('\n=== Test Complete ===');
  })
  .catch(err => {
    console.error('✗ Compression failed:', err);
    process.exit(1);
  });
