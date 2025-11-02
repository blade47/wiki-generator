import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getWikiPage, loadWikiData } from '@/lib/wiki';
import { CodeReference } from '@/components/code-reference';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export async function generateStaticParams({ params }: { params: { repo: string } }) {
  const wikiData = await loadWikiData(params.repo);

  if (!wikiData) {
    return [];
  }

  return wikiData.pages.map((page) => ({
    slug: page.slug,
  }));
}

export default async function WikiFeaturePage({
  params,
}: {
  params: Promise<{ repo: string; slug: string }>;
}) {
  const { repo, slug } = await params;
  const page = await getWikiPage(repo, slug);

  if (!page) {
    notFound();
  }

  // Load wiki data to get repo URL
  const wikiData = await loadWikiData(repo);
  const repoUrl = wikiData?.repoUrl;

  // Create components with repoUrl pre-filled
  const components = {
    CodeReference: (props: { file: string; line: number }) => (
      <CodeReference {...props} repoUrl={repoUrl} />
    ),
    Badge,
    Separator,
  };

  return (
    <div>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">
          {page.category}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
        {page.metadata.summary && (
          <p className="text-lg text-muted-foreground leading-relaxed">{page.metadata.summary}</p>
        )}
      </div>

      <Separator className="my-8" />

      <article className="prose">
        <MDXRemote source={page.content} components={components} />
      </article>
    </div>
  );
}
