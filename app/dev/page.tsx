'use client';

import { useState } from 'react';
import type { WikiOutput } from '@/workflows/wikiGeneration/types';

export default function DevPage() {
  const [githubUrl, setGithubUrl] = useState('sindresorhus/is');
  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<WikiOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('Starting workflow...');
    setResult(null);

    try {
      const response = await fetch('/api/generate-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl,
          options: {
            maxFiles: 20,
            maxFileSize: 100000,
            maxFeaturesPerCategory: 3,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRunId(data.runId);
        setStatus('Workflow started! Polling for status...');
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

        setStatus(`Status: ${data.status}`);

        if (data.status === 'completed') {
          clearInterval(interval);
          setResult(data.result);
          setLoading(false);
          setStatus('✓ Workflow completed!');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('✗ Workflow failed');
          setLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (loading) {
        setStatus('Polling timeout - workflow may still be running');
        setLoading(false);
      }
    }, 300000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wiki Generator - Dev Tool</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate Wiki</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              GitHub Repository
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
              className="w-full border border-gray-300 rounded px-3 py-2"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Examples: sindresorhus/is, vercel/next.js
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !githubUrl}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Wiki'}
          </button>
        </div>

        {runId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Status</h2>
            <div className="mb-2">
              <span className="font-medium">Run ID:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{runId}</code>
            </div>
            <div className="mb-4">
              <span className="font-medium">Status:</span>{' '}
              <span className="text-blue-600">{status}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>

            <div className="mb-4">
              <div className="mb-2">
                <span className="font-medium">Pages Generated:</span>{' '}
                {result.pagesGenerated}
              </div>
              <div className="mb-2">
                <span className="font-medium">Output Directory:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {result.outputDir}
                </code>
              </div>
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2">
                Repository Info
              </summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result.wikiData.repoInfo, null, 2)}
              </pre>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2">
                Recon Analysis
              </summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result.wikiData.recon, null, 2)}
              </pre>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2">
                Features ({result.wikiData.features.features.length})
              </summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result.wikiData.features, null, 2)}
              </pre>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2">
                Architecture
              </summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result.wikiData.architecture, null, 2)}
              </pre>
            </details>

            <details>
              <summary className="cursor-pointer font-medium mb-2">
                Pages ({result.wikiData.pages.length})
              </summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
                {JSON.stringify(result.wikiData.pages, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
