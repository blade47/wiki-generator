import { notFound } from 'next/navigation';
import { loadWikiData } from '@/lib/wiki';
import { WikiSidebar } from '@/components/wiki-sidebar';

export default async function WikiLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const wikiData = await loadWikiData(repo);

  if (!wikiData) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <WikiSidebar
        repoName={wikiData.repoName}
        repoSlug={wikiData.repoSlug}
        pages={wikiData.pages.map(p => ({
          slug: p.slug,
          title: p.title,
          category: p.category,
          importance: p.importance,
        }))}
      />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-10 px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
