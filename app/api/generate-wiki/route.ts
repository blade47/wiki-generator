/**
 * API Route: Generate Wiki
 *
 * Triggers the wiki generation workflow for a GitHub repository
 */

import { start } from 'workflow/api';
import { wikiGenerationWorkflow } from '@/workflows/wikiGeneration';
import type { WikiGenerationInput } from '@/workflows/wikiGeneration/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { githubUrl, options } = body as WikiGenerationInput;

    if (!githubUrl) {
      return Response.json(
        { error: 'githubUrl is required' },
        { status: 400 }
      );
    }

    // Start the workflow
    const run = await start(wikiGenerationWorkflow, [{ githubUrl, options }]);

    // Return workflow run info
    return Response.json({
      success: true,
      runId: run.runId,
      status: 'running',
      message: 'Wiki generation started',
    });
  } catch (error) {
    console.error('Failed to start wiki generation:', error);
    return Response.json(
      { error: 'Failed to start wiki generation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple health check
  return Response.json({
    service: 'Wiki Generator',
    status: 'ready',
    endpoints: {
      post: '/api/generate-wiki',
      description: 'Start wiki generation for a GitHub repository',
      body: {
        githubUrl: 'string (required)',
        options: {
          maxFiles: 'number (optional, default: 300)',
          maxFileSize: 'number (optional, default: 500000)',
        },
      },
    },
  });
}
