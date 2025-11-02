import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { loadWikiData } from '@/lib/wiki';
import { CodeReference } from '@/components/code-reference';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const components = {
  CodeReference,
  Badge,
  Separator,
};

export default async function WikiIndexPage({ params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params;
  const wikiData = await loadWikiData(repo);

  if (!wikiData) {
    notFound();
  }

  return (
    <article className="prose">
      <MDXRemote source={wikiData.indexContent} components={components} />
    </article>
  );
}
