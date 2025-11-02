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
import { findRelevantCode } from './steps/findRelevantCode';
import { generateDocs } from './steps/generateDocs';
import { saveToFileSystem } from './steps/saveToFileSystem';

import type { WikiGenerationInput, WikiOutput, WikiData, WikiPage } from './types';

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
    maxFiles = 100,
    maxFileSize = 500000,
    maxFeaturesPerCategory = 5,
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

  // Group features by category and limit
  const featuresByCategory = new Map<string, typeof features.features>();

  for (const feature of features.features) {
    const category = feature.category;
    const existing = featuresByCategory.get(category) ?? [];

    if (existing.length < maxFeaturesPerCategory) {
      featuresByCategory.set(category, [...existing, feature]);
    }
  }

  // Flatten features to process
  const featuresToProcess = Array.from(featuresByCategory.values()).flat();

  console.log(`Generating documentation for ${featuresToProcess.length} features...`);

  // Process features in parallel batches of 3 to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < featuresToProcess.length; i += batchSize) {
    const batch = featuresToProcess.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async feature => {
        // Find relevant code using HyDE + RAG
        const relevantChunks = await findRelevantCode({
          feature,
          repoName: repoData.name,
          repoOverview: recon.overview,
          techStack: recon.techStack,
          indexState,
        });

        // Generate documentation
        const docs = await generateDocs({
          feature,
          repoName: repoData.name,
          repoOverview: recon.overview,
          relevantChunks,
        });

        return docs;
      })
    );

    // Add to pages
    batch.forEach((feature, idx) => {
      pages.push({
        featureId: slugify(feature.name),
        category: feature.category,
        title: feature.name,
        slug: slugify(feature.name),
        content: batchResults[idx],
      });
    });

    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(featuresToProcess.length / batchSize)}`);
  }

  // Step 8: Build wiki data
  const wikiData: WikiData = {
    repoInfo: {
      name: repoData.name,
      fullName: repoData.fullName,
      description: repoData.description,
      url: githubUrl,
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

  // Step 9: Save to file system
  const outputDir = await saveToFileSystem(wikiData);

  console.log('='.repeat(70));
  console.log('✓ WIKI GENERATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`Pages generated: ${pages.length}`);
  console.log(`Output directory: ${outputDir}`);
  console.log('='.repeat(70));

  return {
    outputDir,
    pagesGenerated: pages.length,
    wikiData,
  };
}
