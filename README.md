# Wiki Generator

Transform any GitHub repository into comprehensive, user-focused documentation automatically. Built with advanced RAG (Retrieval-Augmented Generation) pipeline featuring semantic code analysis, hybrid search, and AI-powered content generation.


## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your OPENAI_API_KEY

# Run development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```


## Project Structure

```
wiki-generator/
├── app/                   # Next.js 16 App Router
├── lib/
│   ├── agents/           # AI Agent System
│   ├── rag/              # RAG Pipeline (Phase 1)
│   ├── github/           # GitHub API client
│   └── utils/            # Utilities
├── scripts/              # Test scripts
└── workflows/            # Vercel Workflow (Phase 3)
```

## Core Principles

1. **KISS** - Keep implementations simple
2. **DRY** - Reuse through utilities and patterns
3. **Type Safety** - No `any` types, strict TypeScript
4. **Quality** - Lint and type-check before committing

## Tech Stack

- **Next.js 16** + React 19
- **TypeScript** (strict mode)
- **Vercel AI SDK** + OpenAI
- **Vercel Workflow** (orchestration)
- **Zod** (validation)
- **Tailwind CSS** + shadcn/ui

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Quality checks
npm run lint             # ESLint (must pass)
npx tsc --noEmit        # Type checking (must pass)

# Deployment
vercel                   # Deploy to Vercel
```

## Environment Variables

```env
OPENAI_API_KEY=sk-...              # Required
GITHUB_TOKEN=ghp_...               # Optional (higher rate limits)
```

## Development Workflow

1. Follow established patterns (agents, RAG components)
2. Write code following KISS, DRY, type-safe principles
3. Run `npm run lint` and `npx tsc --noEmit`
4. Test your changes with relevant test scripts
5. Commit with clear messages

## Code Quality Standards

- ✅ All code passes ESLint (0 errors, 0 warnings)
- ✅ All code passes TypeScript type checking
- ✅ No `any` types (use `unknown` or specific types)
- ✅ Proper error handling
- ✅ Clear, concise comments

## Agent System

Each agent follows strict 4-file structure:

```
lib/agents/[agent-name]/
├── schema.ts      # Zod validation schema
├── types.ts       # Input/Output TypeScript types
├── prompt.ts      # System + User message builders
└── index.ts       # Agent definition with defineAgent()
```

## Features

### Phase 1: Advanced RAG Pipeline ✅

- **Multi-language AST parsing** with tree-sitter (JavaScript, TypeScript, Python, Go, Rust)
- **Semantic chunking** - Extract functions, classes, methods with precise line numbers
- **Markdown indexing** - README and documentation files included
- **Batch embeddings** - OpenAI text-embedding-3-small (1536 dimensions)
- **Dual BM25** - Separate indexes for code and metadata
- **Hybrid search** - Vector + BM25-Code + BM25-Text with RRF fusion
- **3-stage reranking** - 100 → 30 → 10 with embedding similarity + LLM scoring
- **Code compression** - AI-powered reduction for large chunks

## License

MIT
