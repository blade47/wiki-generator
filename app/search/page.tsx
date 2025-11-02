'use client';

import { useState } from 'react';
import { Search, Loader2, Code2, FileCode, Info, Sparkles, Database, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SearchResult {
  id: string;
  filePath: string;
  name: string;
  type: string;
  language: string;
  startLine: number;
  endLine: number;
  code: string;
  snippet: string;
  score: number;
  repoUrl: string;
  defaultBranch: string;
}

function buildGitHubUrl(repoUrl: string, filePath: string, startLine: number, endLine: number, branch: string): string {
  // Normalize GitHub URL
  let normalized = repoUrl.replace(/\.git$/, '');

  // Ensure it has https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    if (normalized.startsWith('github.com')) {
      normalized = `https://${normalized}`;
    } else {
      normalized = `https://github.com/${normalized}`;
    }
  }

  // Build GitHub blob URL with line numbers
  return `${normalized}/blob/${branch}/${filePath}#L${startLine}-L${endLine}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 20 }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Search error:', data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Search className="h-10 w-10" />
          <h1 className="text-4xl font-bold">Semantic Code Search</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Search across all documented repositories using natural language.
          Powered by AI embeddings and vector similarity.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Try: "authentication logic", "user registration", "API endpoints"...'
              className="w-full border border-input rounded-md px-3 py-2 pl-11 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            size="default"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap justify-center mt-4">
          <span className="text-sm text-muted-foreground">Examples:</span>
          {['user authentication', 'database queries', 'API routes', 'error handling'].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                setTimeout(() => handleSearch(), 100);
              }}
              className="text-sm px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      {showInfo && !searched && (
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="border rounded-lg p-6 bg-card relative">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">What you&apos;ll find</h3>
                <p className="text-muted-foreground mb-4">
                  Search returns <strong>actual code chunks</strong> from all indexed repositories.
                  Each result shows the exact implementation with file location and line numbers.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Semantic Understanding</h4>
                  <p className="text-sm text-muted-foreground">
                    &quot;authentication&quot; finds login, signup, validateUser, and checkPermissions
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Database className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Code Chunks Indexed</h4>
                  <p className="text-sm text-muted-foreground">
                    Functions, classes, components, interfaces, README sections, and config files
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Similarity Scores</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-powered vector search ranks results by semantic similarity
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="text-sm font-medium">Example result for &quot;database queries&quot;:</p>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">typescript</Badge>
                  <Badge variant="outline" className="text-xs">function</Badge>
                  <Badge className="text-xs bg-green-600">92% match</Badge>
                </div>
                <code className="text-muted-foreground">
                  <strong>findUserById()</strong> from <span className="text-foreground">db/users.ts</span> (Lines 45-52)
                </code>
                <p className="text-muted-foreground mt-2">
                  Shows full implementation, dependencies, and exact location
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Searching codebase...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try a different search query or check if wikis have been generated.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              Found {results.length} results
            </h2>
            <Badge variant="secondary">{query}</Badge>
          </div>

          {results.map((result) => (
            <div
              key={result.id}
              className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-card"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {result.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {result.filePath}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        Lines {result.startLine}-{result.endLine}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <Badge variant="secondary" className="text-xs">
                    {result.language}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {result.type}
                  </Badge>
                  <Badge
                    variant="default"
                    className="text-xs bg-green-600"
                  >
                    {Math.round(result.score * 100)}% match
                  </Badge>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Code Preview */}
              <div className="bg-muted/50 rounded-md p-4 overflow-auto">
                <pre className="text-sm">
                  <code>{result.code}</code>
                </pre>
                {result.code.length >= 500 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Preview truncated at 500 characters...
                  </p>
                )}
              </div>

              {/* View on GitHub Button */}
              <div className="mt-3 flex justify-end">
                <a
                  href={buildGitHubUrl(
                    result.repoUrl,
                    result.filePath,
                    result.startLine,
                    result.endLine,
                    result.defaultBranch
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full Code on GitHub
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
