'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Loader2, CheckCircle2, XCircle, ExternalLink, Github } from 'lucide-react';
import type { WikiOutput } from '@/workflows/wikiGeneration/types';

export default function GeneratePage() {
  const [githubUrl, setGithubUrl] = useState('sindresorhus/is');
  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<WikiOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('Starting workflow...');
    setResult(null);
    setCurrentStep('Initializing workflow');

    try {
      const response = await fetch('/api/generate-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl,
          options: {
            maxFiles: 300,
            maxFileSize: 500000,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRunId(data.runId);
        setStatus('running');
        pollStatus(data.runId);
      } else {
        setStatus(`Error: ${data.error}`);
        setLoading(false);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
      setLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflow-status?runId=${id}`);
        const data = await response.json();

        setStatus(data.status);

        // Keep current step showing
        if (data.status === 'running') {
          setCurrentStep('Processing wiki generation...');
        }

        if (data.status === 'completed') {
          clearInterval(interval);
          setResult(data.result);
          setLoading(false);
          setStatus('completed');
          setCurrentStep('Wiki generated successfully!');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          setLoading(false);
          setCurrentStep('Workflow failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      if (loading) {
        setStatus('timeout');
        setCurrentStep('Workflow timeout - may still be running');
        setLoading(false);
      }
    }, 600000); // 10 minutes
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Generate Wiki</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Enter any GitHub repository URL to generate comprehensive AI-powered documentation.
        </p>
      </div>

      <div className="border rounded-lg p-6 mb-6 bg-card">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            GitHub Repository
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="owner/repo or https://github.com/owner/repo"
                className="w-full border border-input rounded-md px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !githubUrl}
              size="default"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Examples: <code className="bg-muted px-1.5 py-0.5 rounded">sindresorhus/is</code>,{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">vercel/next.js</code>
          </p>
        </div>
      </div>

      {runId && (
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Workflow Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Run ID:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {runId}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {status === 'running' ? (
                <Badge variant="default" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running
                </Badge>
              ) : status === 'completed' ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              ) : status === 'failed' ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Failed
                </Badge>
              ) : (
                <Badge variant="secondary">{status}</Badge>
              )}
            </div>

            {status === 'running' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Status:</span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {currentStep}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take 2-5 minutes depending on repository size. Check terminal logs for detailed progress.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="border rounded-lg p-6 mb-6 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Wiki Generated Successfully!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Generated {result.pagesGenerated} documentation pages for {result.wikiData.repoInfo.name}
                </p>
                <div className="flex gap-2">
                  <Link href={result.outputDir}>
                    <Button className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Wiki
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => {
                    setResult(null);
                    setRunId('');
                    setStatus('');
                  }}>
                    Generate Another
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                <span>Repository Information</span>
                <Badge variant="secondary">metadata</Badge>
              </summary>
              <pre className="mt-3 bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result.wikiData.repoInfo, null, 2)}
              </pre>
            </details>

            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                <span>Reconnaissance Analysis</span>
                <Badge variant="secondary">tech stack</Badge>
              </summary>
              <pre className="mt-3 bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result.wikiData.recon, null, 2)}
              </pre>
            </details>

            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                <span>Detected Features</span>
                <Badge variant="secondary">{result.wikiData.features.features.length} features</Badge>
              </summary>
              <pre className="mt-3 bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result.wikiData.features, null, 2)}
              </pre>
            </details>

            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                <span>Architecture Analysis</span>
                <Badge variant="secondary">patterns</Badge>
              </summary>
              <pre className="mt-3 bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result.wikiData.architecture, null, 2)}
              </pre>
            </details>

            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                <span>Generated Pages</span>
                <Badge variant="secondary">{result.wikiData.pages.length} pages</Badge>
              </summary>
              <pre className="mt-3 bg-muted p-4 rounded-md overflow-auto text-xs max-h-96">
                {JSON.stringify(result.wikiData.pages, null, 2)}
              </pre>
            </details>
          </div>
        </>
      )}
    </div>
  );
}
