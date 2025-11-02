/**
 * API Route: Semantic Code Search
 */

import { NextRequest, NextResponse } from 'next/server';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { searchSimilarCode } from '@/lib/vector-storage';
import { EMBEDDING_MODEL } from '@/lib/rag/embedder';

export async function POST(request: NextRequest) {
  try {
    const { query, repoSlug, topK = 10 } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`[Search API] Query: "${query}" | Repo: ${repoSlug || 'all'} | Top K: ${topK}`);

    // Generate embedding for the query
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: query,
    });

    console.log(`[Search API] Generated embedding (${embedding.length} dimensions)`);

    // Search in Upstash Vector
    const results = await searchSimilarCode(query, embedding, repoSlug, topK);

    console.log(`[Search API] Found ${results.length} results`);

    // Format results for client
    const formattedResults = results.map(({ chunk, score, repoUrl, defaultBranch }) => {
      const code = chunk.code || ''; // Fallback for missing code

      return {
        id: chunk.id,
        filePath: chunk.filePath,
        name: chunk.name,
        type: chunk.type,
        language: chunk.language,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        code, // This is already a snippet (max 500 chars from vector storage)
        score: score,
        // Use first 200 chars for card preview (safe with fallback)
        snippet: code.slice(0, 200) + (code.length > 200 ? '...' : ''),
        // GitHub link info
        repoUrl,
        defaultBranch,
      };
    });

    return NextResponse.json({
      query,
      results: formattedResults,
      count: formattedResults.length,
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
