/**
 * Vercel Blob Storage Layer
 *
 * Stores wiki data in Vercel Blob instead of filesystem
 */

import { put, list, head, del } from '@vercel/blob';
import type { WikiData } from '@/workflows/wikiGeneration/types';

/**
 * Save complete wiki data to Blob
 */
export async function saveWikiToBlob(wikiData: WikiData): Promise<void> {
  const { repoInfo, pages } = wikiData;
  const repoSlug = slugify(repoInfo.name);

  // Save metadata
  await put(`wikis/${repoSlug}/metadata.json`, JSON.stringify(wikiData, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  });

  // Save index page
  const indexMDX = generateIndexMDX(wikiData);
  await put(`wikis/${repoSlug}/index.mdx`, indexMDX, {
    access: 'public',
    addRandomSuffix: false,
  });

  // Save each feature page
  for (const page of pages) {
    const mdx = generatePageMDX(page, repoInfo);
    await put(`wikis/${repoSlug}/${page.slug}.mdx`, mdx, {
      access: 'public',
      addRandomSuffix: false,
    });
  }

  console.log(`✓ Saved wiki to Blob: ${repoSlug} (${pages.length + 1} files)`);
}

/**
 * Get all wiki repositories from Blob
 */
export async function getWikiReposFromBlob(): Promise<string[]> {
  try {
    const blobs = await list({ prefix: 'wikis/' });

    // Extract unique repo names from blob keys
    const repos = new Set<string>();

    for (const blob of blobs.blobs) {
      const match = blob.pathname.match(/^wikis\/([^/]+)\//);
      if (match) {
        repos.add(match[1]);
      }
    }

    return Array.from(repos).sort();
  } catch {
    // During build time or when no blobs exist yet, return empty array
    return [];
  }
}

/**
 * Load wiki metadata from Blob
 */
export async function loadWikiMetadataFromBlob(repoSlug: string): Promise<WikiData | null> {
  try {
    const blob = await head(`wikis/${repoSlug}/metadata.json`);

    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    // Silently return null during build or when blob doesn't exist
    return null;
  }
}

/**
 * Load wiki index content from Blob
 */
export async function loadWikiIndexFromBlob(repoSlug: string): Promise<string | null> {
  try {
    const blob = await head(`wikis/${repoSlug}/index.mdx`);

    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url);
    return await response.text();
  } catch {
    // Silently return null during build or when blob doesn't exist
    return null;
  }
}

/**
 * Load specific wiki page from Blob
 */
export async function loadWikiPageFromBlob(repoSlug: string, pageSlug: string): Promise<string | null> {
  try {
    const blob = await head(`wikis/${repoSlug}/${pageSlug}.mdx`);

    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url);
    return await response.text();
  } catch {
    // Silently return null during build or when blob doesn't exist
    return null;
  }
}

/**
 * Delete wiki from Blob
 */
export async function deleteWikiFromBlob(repoSlug: string): Promise<void> {
  const blobs = await list({ prefix: `wikis/${repoSlug}/` });

  for (const blob of blobs.blobs) {
    await del(blob.url);
  }

  console.log(`✓ Deleted wiki from Blob: ${repoSlug}`);
}

// ============================================================================
// Helper functions for MDX generation
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Escape special MDX/JSX characters in markdown content
 * - Curly braces {} are interpreted as JSX expressions
 * - Angle brackets < > can break JSX parsing
 */
function escapeMDX(text: string): string {
  return text
    .replace(/\{/g, '\\{')  // Escape opening curly brace
    .replace(/\}/g, '\\}')  // Escape closing curly brace
    .replace(/</g, '\\<')   // Escape opening angle bracket
    .replace(/>/g, '\\>');  // Escape closing angle bracket
}

/**
 * Escape quotes for YAML frontmatter
 */
function escapeFrontmatter(text: string): string {
  return text.replace(/"/g, '\\"');
}

function generateIndexMDX(wikiData: WikiData): string {
  const { repoInfo, recon, architecture, pages } = wikiData;
  const repoSlug = slugify(repoInfo.name);

  // Group pages by category and sort by importance within each category
  const pagesByCategory = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  // Sort pages within each category by importance (high to low)
  Object.values(pagesByCategory).forEach(categoryPages => {
    categoryPages.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  });

  return `---
title: "${escapeFrontmatter(repoInfo.name)}"
description: "${escapeFrontmatter(repoInfo.description || '')}"
---

# ${escapeMDX(repoInfo.name)}

${escapeMDX(recon.overview)}

## Tech Stack

**Languages**: ${escapeMDX(recon.techStack.languages.join(', '))}

**Frameworks**: ${escapeMDX(recon.techStack.frameworks.join(', '))}

${recon.techStack.tools.length > 0 ? `**Tools**: ${escapeMDX(recon.techStack.tools.join(', '))}` : ''}

## Architecture

${escapeMDX(architecture.overview)}

**Key Patterns**: ${escapeMDX(architecture.patterns.map(p => p.pattern).join(', '))}

## Features

${Object.entries(pagesByCategory).map(([category, categoryPages]) => `
### ${escapeMDX(category)}

${categoryPages.map(page => `- [${escapeMDX(page.title)}](/wiki/${repoSlug}/${page.slug}) - ${escapeMDX(page.content.summary.slice(0, 100))}...`).join('\n')}
`).join('\n')}

---

*Wiki generated on ${wikiData.metadata.generatedAt}*
`.trim();
}

function generatePageMDX(page: WikiData['pages'][0], repoInfo: WikiData['repoInfo']): string {
  const { title, content, category } = page;
  const { summary, content: mainContent, codeExamples, relatedFeatures } = content;
  const repoSlug = slugify(repoInfo.name);

  // Build frontmatter
  const frontmatter = `---
title: "${escapeFrontmatter(title)}"
category: "${escapeFrontmatter(category)}"
summary: "${escapeFrontmatter(summary)}"
${relatedFeatures && relatedFeatures.length > 0 ? `relatedFeatures: [${relatedFeatures.map(f => `"${escapeFrontmatter(f)}"`).join(', ')}]` : ''}
---

`;

  // Build code examples section
  const codeExamplesSection = codeExamples.length > 0 ? `
## Code Examples

${codeExamples.map((ex, idx) => `
### ${idx + 1}. ${escapeMDX(ex.title)}

${escapeMDX(ex.description)}

<CodeReference file="${ex.sourceFile}" line={${ex.lineNumber}} repoUrl="${repoInfo.url}" branch="${repoInfo.defaultBranch}" />

\`\`\`${ex.language}
${ex.code}
\`\`\`
`).join('\n')}
` : '';

  // Build related features section (using absolute paths with repo slug)
  const relatedSection = relatedFeatures && relatedFeatures.length > 0 ? `
## Related Features

${relatedFeatures.map(f => `- [${escapeMDX(f)}](/wiki/${repoSlug}/${slugify(f)})`).join('\n')}
` : '';

  return `${frontmatter}
# ${escapeMDX(title)}

${escapeMDX(mainContent)}

${codeExamplesSection}
${relatedSection}
`.trim();
}
