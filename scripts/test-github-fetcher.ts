/**
 * Test script for GitHub Fetcher
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  parseGitHubUrl,
  fetchRepository,
} from '@/lib/github/fetcher';

console.log('=== Testing GitHub Fetcher ===\n');

async function runTest() {
  // Test URL parsing
  console.log('Step 1: Testing URL parsing...');

  const testUrls = [
    'https://github.com/vercel/next.js',
    'github.com/vercel/next.js',
    'vercel/next.js',
  ];

  testUrls.forEach(url => {
    const parsed = parseGitHubUrl(url);
    console.log(`  ${url} → ${parsed.owner}/${parsed.repo}`);
  });
  console.log('');

  // Test fetching a small public repo
  console.log('Step 2: Fetching a small test repository...');
  console.log('  Repository: sindresorhus/is (small TypeScript utility)\n');

  try {
    const repoData = await fetchRepository('sindresorhus/is', {
      maxFiles: 20,
      maxFileSize: 100000,
    });

    console.log('Repository Data:');
    console.log(`  Name: ${repoData.name}`);
    console.log(`  Full Name: ${repoData.fullName}`);
    console.log(`  Description: ${repoData.description}`);
    console.log(`  Default Branch: ${repoData.defaultBranch}`);
    console.log(`  Files fetched: ${repoData.files.length}`);
    console.log(`  README: ${repoData.readme ? '✓ Found' : '✗ Not found'}`);
    console.log(`  package.json: ${repoData.packageJson ? '✓ Found' : '✗ Not found'}`);
    console.log('');

    console.log('Sample files:');
    repoData.files.slice(0, 5).forEach(file => {
      console.log(`  - ${file.path} (${file.size} bytes)`);
    });
    console.log('');

    console.log('=== Test Complete ===');
    console.log('\n✓ GitHub Fetcher working!');
  } catch (error) {
    console.error('✗ GitHub fetch failed:', error);
    console.log('\nNote: Make sure GITHUB_TOKEN is set in .env.local for higher rate limits');
    console.log('The fetcher works without a token but has lower rate limits');
  }
}

runTest().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
