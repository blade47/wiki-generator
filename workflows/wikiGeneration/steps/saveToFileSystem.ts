/**
 * Step: Save Wiki to File System as MDX
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { WikiData } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateMDX(page: WikiData['pages'][0]): string {
  const { title, content, category } = page;
  const { summary, content: mainContent, codeExamples, relatedFeatures } = content;

  // Build frontmatter
  const frontmatter = `---
title: "${title}"
category: "${category}"
summary: "${summary.replace(/"/g, '\\"')}"
${relatedFeatures && relatedFeatures.length > 0 ? `relatedFeatures: [${relatedFeatures.map(f => `"${f}"`).join(', ')}]` : ''}
---

`;

  // Build code examples section
  const codeExamplesSection = codeExamples.length > 0 ? `
## Code Examples

${codeExamples.map((ex, idx) => `
### ${idx + 1}. ${ex.title}

${ex.description}

<CodeReference file="${ex.sourceFile}" line={${ex.lineNumber}} />

\`\`\`${ex.language}
${ex.code}
\`\`\`
`).join('\n')}
` : '';

  // Build related features section
  const relatedSection = relatedFeatures && relatedFeatures.length > 0 ? `
## Related Features

${relatedFeatures.map(f => `- [${f}](/${slugify(f)})`).join('\n')}
` : '';

  return `${frontmatter}
# ${title}

${mainContent}

${codeExamplesSection}
${relatedSection}
`.trim();
}

function generateIndexMDX(wikiData: WikiData): string {
  const { repoInfo, recon, architecture, pages } = wikiData;

  // Group pages by category
  const pagesByCategory = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, WikiData['pages']>);

  return `---
title: "${repoInfo.name}"
description: "${repoInfo.description}"
---

# ${repoInfo.name}

${recon.overview}

## Tech Stack

**Languages**: ${recon.techStack.languages.join(', ')}

**Frameworks**: ${recon.techStack.frameworks.join(', ')}

${recon.techStack.tools.length > 0 ? `**Tools**: ${recon.techStack.tools.join(', ')}` : ''}

## Architecture

${architecture.overview}

**Key Patterns**: ${architecture.patterns.map(p => p.pattern).join(', ')}

## Features

${Object.entries(pagesByCategory).map(([category, categoryPages]) => `
### ${category}

${categoryPages.map(page => `- [${page.title}](/${page.slug}) - ${page.content.summary.slice(0, 100)}...`).join('\n')}
`).join('\n')}

---

*Wiki generated on ${wikiData.metadata.generatedAt}*
`.trim();
}

export async function saveToFileSystem(wikiData: WikiData): Promise<string> {
  'use step';

  console.log(`[Step] Saving wiki to file system`);

  // Create output directory
  const outputDir = join(process.cwd(), 'generated-wikis', slugify(wikiData.repoInfo.name));
  mkdirSync(outputDir, { recursive: true });

  // Save each page as MDX
  for (const page of wikiData.pages) {
    const mdx = generateMDX(page);
    const filePath = join(outputDir, `${page.slug}.mdx`);
    writeFileSync(filePath, mdx, 'utf-8');
  }

  // Save index page
  const indexMDX = generateIndexMDX(wikiData);
  writeFileSync(join(outputDir, 'index.mdx'), indexMDX, 'utf-8');

  // Save metadata as JSON for easier programmatic access
  writeFileSync(
    join(outputDir, 'metadata.json'),
    JSON.stringify(wikiData, null, 2),
    'utf-8'
  );

  console.log(`[Step] ✓ Saved ${wikiData.pages.length + 1} MDX files to ${outputDir}`);
  return outputDir;
}
