/**
 * Step: Fetch Repository from GitHub
 */

import { fetchRepository, type RepoData } from '@/lib/github/fetcher';

export async function fetchRepo(
  githubUrl: string,
  maxFiles: number,
  maxFileSize: number
): Promise<RepoData> {
  'use step';

  console.log(`[Step] Fetching repository: ${githubUrl}`);

  const repoData = await fetchRepository(githubUrl, {
    maxFiles,
    maxFileSize,
  });

  console.log(`[Step] ✓ Fetched ${repoData.files.length} files from ${repoData.fullName}`);
  return repoData;
}
