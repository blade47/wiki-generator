/**
 * Simple utilities for preprocessing data before sending to AI
 */

/**
 * Format context object into readable sections
 */
export function buildContext(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, value]) => value != null)
    .map(([key, value]) => {
      const title = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
      const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      return `### ${title}:\n${content}`;
    })
    .join('\n\n');
}

/**
 * Truncate text to max characters (rough: 1 token ≈ 4 chars)
 */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[...truncated]';
}

/**
 * Filter items by keywords in path or content
 */
export function filterByKeywords<T extends { path: string; content?: string }>(
  items: T[],
  keywords: string[],
  maxResults: number = 20
): T[] {
  const lower = keywords.map(k => k.toLowerCase());

  return items
    .filter(item => {
      const path = item.path.toLowerCase();
      const content = item.content?.toLowerCase() || '';
      return lower.some(k => path.includes(k) || content.includes(k));
    })
    .slice(0, maxResults);
}
