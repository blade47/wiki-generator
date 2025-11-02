/**
 * Wiki Generation Workflow
 *
 * Orchestrates all steps to generate a complete wiki from a GitHub repository
 */

import { fetchRepo } from './steps/fetchRepo';
import { buildIndex } from './steps/buildIndex';
import { runRecon } from './steps/runRecon';
import { runFeatures } from './steps/runFeatures';
import { runArchitecture } from './steps/runArchitecture';
import { generateDocs } from './steps/generateDocs';
import { saveToBlob } from './steps/saveToBlob';

import type { WikiGenerationInput, WikiOutput, WikiData, WikiPage } from './types';
import {findRelevantCode} from "@/workflows/wikiGeneration/steps/findRelevantCode";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function wikiGenerationWorkflow(input: WikiGenerationInput): Promise<WikiOutput> {
  'use workflow';

  const { githubUrl, options = {} } = input;
  const {
    maxFiles = 300,
    maxFileSize = 500000,
  } = options;

  console.log('='.repeat(70));
  console.log('WIKI GENERATION WORKFLOW');
  console.log('='.repeat(70));
  console.log(`Repository: ${githubUrl}`);

  // Step 1: Fetch repository
  const repoData = await fetchRepo(githubUrl, maxFiles, maxFileSize);

  // Step 2-3: Build RAG index and Run Recon Agent IN PARALLEL
  // Recon only needs README/package.json, not chunks, so run concurrently
  const repoSlug = slugify(repoData.name);
  console.log('Running index building and recon in parallel...');
  const [{ chunks }, recon] = await Promise.all([
    buildIndex(
      repoData.files,
      repoData.name,
      repoSlug,
      githubUrl,
      repoData.defaultBranch
    ),
    runRecon(repoData),
  ]);
  console.log('✓ Index building and recon completed');

  // Step 4-5: Run Features + Architecture Agents IN PARALLEL
  // Both depend on recon but not on each other, so run concurrently
  console.log('Running Features and Architecture agents in parallel...');
  const [features, architecture] = await Promise.all([
    runFeatures(repoData, recon, chunks),
    runArchitecture(recon, chunks),
  ]);
  console.log('✓ Features and Architecture agents completed');

  // Step 7: Generate documentation for important features only (in parallel)
  const pages: WikiPage[] = [];

  // Filter to only important features (importance >= 4) and sort by importance
  const featuresToProcess = [...features.features]
    .filter(f => (f.importance ?? 5) >= 4) // Only document important features
    .sort((a, b) => (b.importance ?? 5) - (a.importance ?? 5));

  const skippedCount = features.features.length - featuresToProcess.length;
  if (skippedCount > 0) {
    console.log(`Skipping ${skippedCount} low-importance features (focusing on ${featuresToProcess.length} important ones)`);
  }

  console.log(`Generating documentation for ${featuresToProcess.length} features in parallel...`);

  // Process ALL features in parallel
  const results = await Promise.all(
    featuresToProcess.map(async feature => {
      // Use chunks already identified by Features Agent
      let relevantChunks = chunks.filter(chunk =>
        feature.relatedChunks.includes(chunk.id)
      );

      // Fallback: If Features Agent didn't identify chunks, use simple embedding search
      if (relevantChunks.length === 0) {
        console.log(`[Workflow] No related chunks for "${feature.name}", using simple embedding search fallback`);
        relevantChunks = await findRelevantCode({
          feature,
          repoName: repoData.name,
          repoOverview: recon.overview,
          techStack: recon.techStack,
          indexState: { chunks },
        });
      } else {
        console.log(`[Workflow] Using ${relevantChunks.length} chunks from Features Agent for "${feature.name}"`);
      }

      // Generate documentation
      const docs = await generateDocs({
        feature,
        repoName: repoData.name,
        repoOverview: recon.overview,
        relevantChunks,
      });

      return { feature, docs };
    })
  );

  // Build pages array
  results.forEach(({ feature, docs }) => {
    pages.push({
      featureId: slugify(feature.name),
      category: feature.category,
      title: feature.name,
      slug: slugify(feature.name),
      content: docs,
      importance: feature.importance ?? 5, // Default to 5 if not provided
    });
  });

  console.log(`✓ Generated documentation for all ${pages.length} features`);

  // Step 7.5: Filter related features to only include pages that exist
  // (safety net so docs do not have broken links)
  const validSlugs = new Set(pages.map(p => p.slug));

  pages.forEach(page => {
    if (page.content.relatedFeatures && page.content.relatedFeatures.length > 0) {
      // Filter to only include features that have actual pages
      page.content.relatedFeatures = page.content.relatedFeatures.filter(featureName => {
        const slug = slugify(featureName);
        return validSlugs.has(slug);
      });
    }
  });

  console.log('Filtered related features to only include existing pages');

  // Step 8: Build wiki data
  const wikiData: WikiData = {
    repoInfo: {
      name: repoData.name,
      fullName: repoData.fullName,
      description: repoData.description,
      url: githubUrl,
      defaultBranch: repoData.defaultBranch,
    },
    recon,
    features,
    architecture,
    pages,
    metadata: {
      totalFiles: repoData.files.length,
      totalChunks: chunks.length,
      generatedAt: new Date().toISOString(),
    },
  };

  // Step 9: Save to Vercel Blob
  await saveToBlob(wikiData);

  console.log('='.repeat(70));
  console.log('✓ WIKI GENERATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`Pages generated: ${pages.length}`);
  console.log(`Repository: ${repoSlug}`);
  console.log(`Wiki URL: /wiki/${repoSlug}`);
  console.log('='.repeat(70));

  return {
    outputDir: `/wiki/${repoSlug}`,
    pagesGenerated: pages.length,
    wikiData,
  };
}
