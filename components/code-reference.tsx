'use client';

import { ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';

interface CodeReferenceProps {
  file: string;
  line: number;
  repoUrl?: string;
  branch?: string;
}

/**
 * Normalize GitHub URL and construct a link to a specific file and line
 */
function buildGitHubUrl(repoUrl: string, file: string, line: number, branch: string = 'main'): string {
  // Normalize the GitHub URL to ensure it has the proper protocol
  let normalized = repoUrl;

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // If it doesn't start with http:// or https://, add https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    // If it starts with github.com, add https://
    if (normalized.startsWith('github.com')) {
      normalized = `https://${normalized}`;
    } else {
      // Assume it's owner/repo format
      normalized = `https://github.com/${normalized}`;
    }
  }

  return `${normalized}/blob/${branch}/${file}#L${line}`;
}

export function CodeReference({ file, line, repoUrl, branch = 'main' }: CodeReferenceProps) {
  const githubUrl = repoUrl ? buildGitHubUrl(repoUrl, file, line, branch) : null;

  const content = (
    <>
      <ExternalLink className="h-3.5 w-3.5" />
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
        {file}
      </code>
      <Badge variant="outline" className="text-xs">
        Line {line}
      </Badge>
    </>
  );

  if (githubUrl) {
    return (
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 w-fit"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
      {content}
    </div>
  );
}
