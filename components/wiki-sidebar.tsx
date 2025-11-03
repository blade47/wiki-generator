'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';

interface WikiPage {
  slug: string;
  title: string;
  category: string;
  importance?: number;
}

interface WikiSidebarProps {
  repoName: string;
  repoSlug: string;
  pages: WikiPage[];
}

export function WikiSidebar({ repoName, repoSlug, pages }: WikiSidebarProps) {
  const pathname = usePathname();

  // Group pages by category
  const pagesByCategory = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, WikiPage[]>);

  // Sort pages within each category by importance (high to low)
  Object.values(pagesByCategory).forEach(categoryPages => {
    categoryPages.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  });

  const categories = Object.keys(pagesByCategory).sort();

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href={`/wiki/${repoSlug}`} className="flex items-center gap-2 font-semibold truncate">
          <BookOpen className="h-5 w-5 flex-shrink-0" />
          <span className="truncate" title={repoName}>{repoName}</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {/* Overview */}
          <div>
            <Link
              href={`/wiki/${repoSlug}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                pathname === `/wiki/${repoSlug}` ? "bg-accent" : "transparent"
              )}
            >
              Overview
            </Link>
          </div>

          <Separator />

          {/* Categories */}
          {categories.map((category) => (
            <div key={category}>
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-0.5">
                {pagesByCategory[category].map((page) => (
                  <Link
                    key={page.slug}
                    href={`/wiki/${repoSlug}/${page.slug}`}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent group",
                      pathname === `/wiki/${repoSlug}/${page.slug}`
                        ? "bg-accent font-medium"
                        : "text-muted-foreground"
                    )}
                    title={page.title}
                  >
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1 break-words leading-tight">{page.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <Link
          href="/wiki"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Wikis
        </Link>
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pages.length} pages</span>
          <Badge variant="outline" className="text-xs">
            {categories.length} categories
          </Badge>
        </div>
      </div>
    </div>
  );
}
