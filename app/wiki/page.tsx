import Link from 'next/link';
import { getWikiRepos } from '@/lib/wiki';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ExternalLink } from 'lucide-react';

export default async function WikisPage() {
  const repos = await getWikiRepos();

  return (
    <div className="container max-w-6xl mx-auto py-16 px-8">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Wiki Generator</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          AI-generated documentation for GitHub repositories. Browse automatically
          generated wikis with feature documentation, code examples, and architecture insights.
        </p>
      </div>

      <Separator className="my-8" />

      {repos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No wikis generated yet.</p>
          <Link href="/generate">
            <Button>
              Generate Your First Wiki
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Available Wikis</h2>
            <Badge variant="secondary">{repos.length} repositories</Badge>
          </div>

          <div className="grid gap-4">
            {repos.map((repo) => (
              <Link
                key={repo}
                href={`/wiki/${repo}`}
                className="block group"
              >
                <div className="border rounded-lg p-6 transition-all hover:border-primary hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {repo}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Click to view documentation
                      </p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="text-center">
            <Link href="/generate">
              <Button variant="outline">
                Generate Another Wiki
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
