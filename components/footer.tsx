import Link from 'next/link';
import { Github, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-semibold mb-3">
              <BookOpen className="h-5 w-5" />
              <span>Wiki Generator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered documentation generator for GitHub repositories.
              Built with Next.js, OpenAI, and Vercel.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/wiki" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Wikis
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Generate Wiki
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Powered by RAG, AI agents, and semantic search to automatically generate comprehensive documentation.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>Built with Next.js, OpenAI, Tree-sitter, and Vercel Blob</p>
          <p>&copy; {new Date().getFullYear()} Wiki Generator</p>
        </div>
      </div>
    </footer>
  );
}
