/**
 * Step: Save Wiki to Vercel Blob Storage
 */

import { saveWikiToBlob, deleteWikiFromBlob } from '@/lib/blob-storage';
import { list } from '@vercel/blob';
import type { WikiData } from '../types';

export async function saveToBlob(wikiData: WikiData): Promise<string> {
  'use step';

  const repoSlug = slugify(wikiData.repoInfo.name);

  console.log(`[Step] Saving wiki to Vercel Blob: ${repoSlug}`);

  // Check if wiki already exists
  try {
    const existingBlobs = await list({ prefix: `wikis/${repoSlug}/` });

    if (existingBlobs.blobs.length > 0) {
      console.log(`[Step] Found existing wiki, cleaning up ${existingBlobs.blobs.length} files...`);
      await deleteWikiFromBlob(repoSlug);
    }
  } catch {
    // No existing wiki or error checking, continue with save
    console.log(`[Step] No existing wiki found, creating new...`);
  }

  // Save new wiki
  await saveWikiToBlob(wikiData);

  console.log(`[Step] ✓ Saved wiki to Blob: ${repoSlug}`);
  return repoSlug;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
