import matter from 'gray-matter';
import {
  getWikiReposFromBlob,
  loadWikiMetadataFromBlob,
  loadWikiIndexFromBlob,
  loadWikiPageFromBlob,
} from './blob-storage';

export interface WikiMetadata {
  title: string;
  category?: string;
  summary?: string;
  relatedFeatures?: string[];
}

export interface WikiPage {
  slug: string;
  title: string;
  category: string;
  content: string;
  metadata: WikiMetadata;
  importance?: number;
}

export interface WikiData {
  repoName: string;
  repoUrl: string;
  pages: WikiPage[];
  indexContent: string;
  indexMetadata: WikiMetadata;
}

/**
 * Get all available wiki repositories
 */
export async function getWikiRepos(): Promise<string[]> {
  return await getWikiReposFromBlob();
}

/**
 * Load wiki data for a specific repository
 */
export async function loadWikiData(repoSlug: string): Promise<WikiData | null> {
  // Load metadata
  const metadata = await loadWikiMetadataFromBlob(repoSlug);

  if (!metadata) {
    return null;
  }

  // Load index
  const indexContent = await loadWikiIndexFromBlob(repoSlug);

  if (!indexContent) {
    return null;
  }

  const { data: indexFrontmatter, content: indexBody } = matter(indexContent);

  // Build pages from metadata
  const pages: WikiPage[] = metadata.pages.map(page => ({
    slug: page.slug,
    title: page.title,
    category: page.category,
    content: '', // Will be loaded on demand
    metadata: {
      title: page.title,
      category: page.category,
      summary: page.content.summary,
    },
    importance: page.importance,
  }));

  return {
    repoName: metadata.repoInfo.name,
    repoUrl: metadata.repoInfo.url,
    pages,
    indexContent: indexBody,
    indexMetadata: indexFrontmatter as WikiMetadata,
  };
}

/**
 * Get a specific wiki page
 */
export async function getWikiPage(repoSlug: string, pageSlug: string): Promise<WikiPage | null> {
  // Load page content from Blob
  const pageContent = await loadWikiPageFromBlob(repoSlug, pageSlug);

  if (!pageContent) {
    return null;
  }

  const { data, content } = matter(pageContent);
  const metadata = data as WikiMetadata;

  return {
    slug: pageSlug,
    title: metadata.title || pageSlug,
    category: metadata.category || 'General',
    content,
    metadata,
  };
}
