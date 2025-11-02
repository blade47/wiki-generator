import { Octokit } from '@octokit/rest';
import type { RepoFile, RepoMetadata, RepoContext } from '@/lib/types';

export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  parseGitHubUrl(url: string): { owner: string; repo: string } {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(regex);

    if (!match) {
      throw new Error('Invalid GitHub URL');
    }

    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
    };
  }

  /**
   * Fetch repository metadata
   */
  async fetchMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    const { data } = await this.octokit.repos.get({ owner, repo });

    return {
      owner,
      name: repo,
      fullName: data.full_name,
      description: data.description,
      url: data.html_url,
      defaultBranch: data.default_branch,
      language: data.language,
      stars: data.stargazers_count,
      topics: data.topics || [],
    };
  }

  /**
   * Fetch file content
   */
  async fetchFile(owner: string, repo: string, path: string, branch: string): Promise<RepoFile | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        return null;
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        path: data.path,
        content,
        size: data.size,
        sha: data.sha,
      };
    } catch (error) {
      console.warn(`Failed to fetch file ${path}:`, error);
      return null;
    }
  }

  /**
   * Fetch repository tree (all files)
   */
  async fetchTree(owner: string, repo: string, branch: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      });

      return data.tree
        .filter(item => item.type === 'blob')
        .map(item => item.path!)
        .filter(path => !this.shouldIgnoreFile(path));
    } catch (error) {
      console.error('Failed to fetch tree:', error);
      return [];
    }
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(path: string): boolean {
    const ignoredPatterns = [
      /node_modules\//,
      /\.git\//,
      /dist\//,
      /build\//,
      /\.next\//,
      /coverage\//,
      /\.cache\//,
      /package-lock\.json/,
      /yarn\.lock/,
      /pnpm-lock\.yaml/,
      /\.map$/,
      /\.min\.js$/,
      /\.svg$/,
      /\.png$/,
      /\.jpg$/,
      /\.jpeg$/,
      /\.gif$/,
      /\.ico$/,
      /\.woff$/,
      /\.woff2$/,
      /\.ttf$/,
      /\.eot$/,
    ];

    return ignoredPatterns.some(pattern => pattern.test(path));
  }

  /**
   * Identify important files to fetch
   */
  async identifyImportantFiles(owner: string, repo: string, branch: string, allPaths: string[]): Promise<string[]> {
    const importantPatterns = [
      /^README\.md$/i,
      /^package\.json$/,
      /^Cargo\.toml$/,
      /^go\.mod$/,
      /^requirements\.txt$/,
      /^setup\.py$/,
      /^index\.(ts|js|tsx|jsx|py|go|rs)$/,
      /^main\.(ts|js|tsx|jsx|py|go|rs)$/,
      /^app\.(ts|js|tsx|jsx|py)$/,
      /^server\.(ts|js|tsx|jsx|py)$/,
      /(routes?|api)\//i,
      /(components?)\//i,
      /(pages?)\//i,
      /(views?)\//i,
      /(controllers?)\//i,
      /(handlers?)\//i,
      /\.test\.(ts|js|tsx|jsx|py)$/,
      /\.spec\.(ts|js|tsx|jsx|py)$/,
    ];

    // Get important files
    const important = allPaths.filter(path =>
      importantPatterns.some(pattern => pattern.test(path))
    );

    // Limit to avoid rate limits - prioritize smaller files first
    return important.slice(0, 50);
  }

  /**
   * Fetch repository context with all important files
   */
  async fetchRepoContext(repoUrl: string): Promise<RepoContext> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const metadata = await this.fetchMetadata(owner, repo);
    const branch = metadata.defaultBranch;

    // Fetch README
    const readme = await this.fetchFile(owner, repo, 'README.md', branch);

    // Fetch package.json or similar
    let packageJson = null;
    const pkgFile = await this.fetchFile(owner, repo, 'package.json', branch);
    if (pkgFile) {
      try {
        packageJson = JSON.parse(pkgFile.content);
      } catch {
        console.warn('Failed to parse package.json');
      }
    }

    // Get all file paths
    const allPaths = await this.fetchTree(owner, repo, branch);

    // Identify and fetch important files
    const importantPaths = await this.identifyImportantFiles(owner, repo, branch, allPaths);

    const mainFilesPromises = importantPaths.map(path =>
      this.fetchFile(owner, repo, path, branch)
    );

    const mainFilesResults = await Promise.all(mainFilesPromises);
    const mainFiles = mainFilesResults.filter((f): f is RepoFile => f !== null);

    return {
      metadata,
      readme: readme?.content || null,
      packageJson,
      mainFiles,
      allFiles: mainFiles, // For now, same as mainFiles to avoid rate limits
    };
  }
}
