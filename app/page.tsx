import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Sparkles, Code2, Search, Brain, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="container max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Documentation
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Wiki Generator
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Automatically generate comprehensive, AI-powered documentation for any GitHub repository.
            Powered by RAG, vector search, and multi-agent AI systems.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/generate">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Your First Wiki
              </Button>
            </Link>
            <Link href="/wiki">
              <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Browse Examples
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Separator className="my-16" />

      {/* Features Section */}
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AST Parsing</h3>
            <p className="text-muted-foreground">
              Uses Tree-sitter to parse code into Abstract Syntax Trees,
              understanding the structure of TypeScript, Python, Rust, Go, and more.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vector Search</h3>
            <p className="text-muted-foreground">
              Uses semantic embeddings and cosine similarity for fast, accurate code retrieval
              across your entire codebase.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Agent System</h3>
            <p className="text-muted-foreground">
              4 specialized AI agents analyze your codebase: Recon (tech stack), Features (user-facing),
              Architecture (patterns), and Documentation Generator.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Chunking</h3>
            <p className="text-muted-foreground">
              Semantic code chunking extracts functions, classes, and methods with precise line numbers
              and context for accurate documentation.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rich Documentation</h3>
            <p className="text-muted-foreground">
              Generates feature guides, architecture overviews, code examples,
              and cross-references in beautiful MDX format.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
            <p className="text-muted-foreground">
              Built on Vercel serverless with Blob storage, optimized for
              scalability and instant deployments.
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-16" />

      {/* CTA Section */}
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Generate?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Transform your GitHub repository into comprehensive documentation in minutes.
          </p>
          <Link href="/generate">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Start Generating
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
