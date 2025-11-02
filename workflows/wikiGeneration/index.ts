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

  // Step 2: Build RAG index and get serializable state
  const indexState = await buildIndex(repoData.files);

  // Step 3: Run Recon Agent
  const recon = await runRecon(repoData);

  // Step 4: Run Features Agent
  const features = await runFeatures(repoData, recon, indexState.chunks);

  // Step 5: Run Architecture Agent
  const architecture = await runArchitecture(recon, indexState.chunks);

  // Step 7: Generate documentation for each feature (in parallel batches)
  const pages: WikiPage[] = [];

  // Sort features by importance (high to low) to prioritize critical features
  const featuresToProcess =
      [...features.features].sort((a, b) => (b.importance ?? 5) - (a.importance ?? 5));

  console.log(`Generating documentation for ${featuresToProcess.length} features in parallel...`);

  // Process ALL features in parallel
  const results = await Promise.all(
    featuresToProcess.map(async feature => {
      // Use chunks already identified by Features Agent
      let relevantChunks = indexState.chunks.filter(chunk =>
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
          indexState,
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
      totalChunks: indexState.chunks.length,
      generatedAt: new Date().toISOString(),
    },
  };

  // Step 9: Save to Vercel Blob
  const repoSlug = await saveToBlob(wikiData);

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
