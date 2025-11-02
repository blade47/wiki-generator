/**
 * GitHub Repository Fetcher
 *
 * Fetches files from a GitHub repository using Octokit
 */

import { Octokit } from '@octokit/rest';

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export interface RepoData {
  name: string;
  fullName: string;
  description: string;
  files: RepoFile[];
  readme?: string;
  packageJson?: string;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): GitHubRepo {
  // Support formats:
  // - https://github.com/owner/repo
  // - github.com/owner/repo
  // - owner/repo
  const cleaned = url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
  const parts = cleaned.split('/');

  if (parts.length < 2) {
    throw new Error('Invalid GitHub URL. Expected format: owner/repo');
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ''),
    branch: parts[3] === 'tree' ? parts[4] : 'main',
  };
}

/**
 * Create Octokit instance
 */
export function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;

  return new Octokit({
    auth: token,
    userAgent: 'wiki-generator',
  });
}

/**
 * Fetch repository tree (file list)
 */
export async function fetchRepoTree(
  octokit: Octokit,
  repo: GitHubRepo
): Promise<Array<{ path: string; type: string; size: number }>> {
  const { owner, repo: repoName, branch = 'main' } = repo;

  try {
    // Get the tree recursively
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${branch}`,
    });

    const { data: tree } = await octokit.git.getTree({
      owner,
      repo: repoName,
      tree_sha: ref.object.sha,
      recursive: 'true',
    });

    return tree.tree
      .filter(item => item.type === 'blob' && item.path && item.size !== undefined)
      .map(item => ({
        path: item.path!,
        type: item.type!,
        size: item.size!,
      }));
  } catch (error) {
    throw new Error(`Failed to fetch repository tree: ${error}`);
  }
}

/**
 * Check if file should be fetched
 */
export function shouldFetchFile(path: string): boolean {
  // Skip common non-essential files
  const skipPatterns = [
    /node_modules\//,
    /\.git\//,
    /dist\//,
    /build\//,
    /coverage\//,
    /\.next\//,
    /out\//,
    /\.cache\//,
    /\.vercel\//,
    /\.turbo\//,
    /\.yarn\//,
    /\.pnp\./,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i,
    /\.(mp4|mp3|mov|avi)$/i,
    /\.(pdf|doc|docx|xls|xlsx)$/i,
    /\.map$/,
  ];

  return !skipPatterns.some(pattern => pattern.test(path));
}

/**
 * Fetch file content
 */
export async function fetchFileContent(
  octokit: Octokit,
  repo: GitHubRepo,
  path: string
): Promise<string> {
  const { owner, repo: repoName, branch = 'main' } = repo;

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path,
      ref: branch,
    });

    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    throw new Error('File has no content');
  } catch (error) {
    console.warn(`Failed to fetch ${path}:`, error);
    return '';
  }
}

/**
 * Fetch repository data
 */
export async function fetchRepository(
  githubUrl: string,
  options: {
    maxFiles?: number;
    maxFileSize?: number; // bytes
  } = {}
): Promise<RepoData> {
  const { maxFiles = 100, maxFileSize = 500000 } = options;

  const repo = parseGitHubUrl(githubUrl);
  const octokit = createOctokit();

  console.log(`Fetching ${repo.owner}/${repo.repo}...`);

  // Get repository info
  const { data: repoInfo } = await octokit.repos.get({
    owner: repo.owner,
    repo: repo.repo,
  });

  // Get file tree
  const tree = await fetchRepoTree(octokit, repo);
  console.log(`Found ${tree.length} files in repository`);

  // Filter and prioritize files
  const filesToFetch = tree
    .filter(f => shouldFetchFile(f.path))
    .filter(f => f.size <= maxFileSize)
    .sort((a, b) => {
      // Prioritize important files
      const priority = (path: string) => {
        if (path === 'README.md') return 0;
        if (path === 'package.json') return 1;
        if (path.match(/\.(ts|js|py|go|rs)$/)) return 2;
        if (path.match(/\.md$/)) return 3;
        return 4;
      };
      return priority(a.path) - priority(b.path);
    })
    .slice(0, maxFiles);

  console.log(`Fetching ${filesToFetch.length} files...`);

  // Fetch file contents
  const files: RepoFile[] = [];
  let readme: string | undefined;
  let packageJson: string | undefined;

  for (const file of filesToFetch) {
    const content = await fetchFileContent(octokit, repo, file.path);

    if (!content) continue;

    files.push({
      path: file.path,
      content,
      size: file.size,
    });

    // Extract special files
    if (file.path.toLowerCase() === 'readme.md') {
      readme = content;
    }
    if (file.path === 'package.json') {
      packageJson = content;
    }
  }

  console.log(`Successfully fetched ${files.length} files`);

  return {
    name: repo.repo,
    fullName: repoInfo.full_name,
    description: repoInfo.description || '',
    files,
    readme,
    packageJson,
  };
}
