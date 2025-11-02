/**
 * API Route: Workflow Status
 *
 * Check the status of a workflow run
 */

import { getRun } from 'workflow/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return Response.json(
        { error: 'runId query parameter is required' },
        { status: 400 }
      );
    }

    // Get the workflow run
    const run = getRun(runId);
    const status = await run.status;

    // If completed, get the result
    if (status === 'completed') {
      const result = await run.returnValue;
      return Response.json({
        runId,
        status,
        result,
      });
    }

    // If failed, return error info
    if (status === 'failed') {
      return Response.json({
        runId,
        status,
        error: 'Workflow execution failed',
      });
    }

    // Otherwise, it's still running
    return Response.json({
      runId,
      status,
    });
  } catch (error) {
    console.error('Failed to get workflow status:', error);
    return Response.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
}
