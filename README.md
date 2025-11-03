# Wiki Generator

**Transform any GitHub repository into comprehensive, AI-powered documentation with semantic code search.**

Built with advanced RAG (Retrieval-Augmented Generation) pipeline, **knowledge graph for code relationships**, multi-agent system, and vector search for intelligent code discovery.

---

## 🎯 What It Does

1. **📖 Wiki Generation** - Analyzes GitHub repos and generates feature-focused documentation
2. **🧠 Knowledge Graph** - Discovers complete features by following function calls
3. **🔍 Semantic Search** - Natural language search across all indexed codebases
4. **🤖 AI Agents** - 4 specialized agents analyze tech stack, features, and architecture
5. **🔗 GitHub Integration** - Direct links to source code with line numbers

---

## ✨ Key Features

### **Wiki Generation**
- Fetches code from any public GitHub repository
- Builds knowledge graph from function calls (discovers code relationships)
- Analyzes tech stack and architecture patterns
- Identifies user-facing features with complete code flows
- Generates MDX documentation with code examples
- Stores wikis in Vercel Blob for instant access

### **Semantic Code Search**
- Natural language queries ("user authentication", "database queries")
- AI-powered vector embeddings for semantic understanding
- Search across all generated wikis
- View code snippets with GitHub source links
- Fast results with Upstash Vector

### **Multi-Agent System**
1. **Recon Agent** - Identifies tech stack, languages, frameworks, and architecture
2. **Features Agent** - Detects user-facing features using knowledge graph (follows function calls to discover complete features)
3. **Architecture Agent** - Analyzes architectural patterns and design
4. **Docs Generator** - Creates comprehensive documentation with code citations

### **Knowledge Graph**
- Extracts function calls from code using AST parsing (all languages supported)
- Builds graph: `function A` → calls → `function B` → calls → `function C`
- Discovers complete features by finding entry points and traversing the graph
- Example: `login()` → discovers `validateInput()`, `findUser()`, `generateToken()` (complete auth flow)

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd wiki-generator
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add:
# - OPENAI_API_KEY
# - UPSTASH_VECTOR_REST_URL
# - UPSTASH_VECTOR_REST_TOKEN

# 3. Run development server
npm run dev

# 4. Visit http://localhost:3000
```

---

## 📁 Project Structure

```
wiki-generator/
├── app/
│   ├── api/
│   │   ├── generate-wiki/      # Wiki generation endpoint
│   │   ├── search/             # Semantic search endpoint
│   │   └── workflow-status/    # Workflow status polling
│   ├── generate/               # Wiki generation UI
│   ├── search/                 # Search UI
│   ├── wiki/                   # Wiki display pages
│   └── page.tsx                # Home page
│
├── lib/
│   ├── agents/                 # AI Agent System (4 agents)
│   │   ├── recon/              # Tech stack analysis
│   │   ├── features/           # Feature detection
│   │   ├── architecture/       # Pattern analysis
│   │   ├── docs-generator/     # Documentation generation
│   │   └── shared/             # Agent factory & utilities
│   ├── rag/                    # RAG Pipeline
│   │   ├── chunker.ts          # Code chunking with tree-sitter
│   │   ├── embedder.ts         # OpenAI embeddings
│   │   ├── index.ts            # RAG orchestration
│   │   └── vector-search.ts    # Vector similarity search
│   ├── github/
│   │   └── fetcher.ts          # GitHub API client
│   ├── vector-storage.ts       # Upstash Vector integration
│   ├── blob-storage.ts         # Vercel Blob wiki storage
│   └── wiki.ts                 # Wiki loading utilities
│
├── workflows/
│   └── wikiGeneration/         # Main workflow
│       ├── index.ts            # Orchestration (parallel execution)
│       └── steps/              # Individual steps
│           ├── fetchRepo.ts
│           ├── buildIndex.ts   # Includes vector storage
│           ├── runRecon.ts
│           ├── runFeatures.ts
│           ├── runArchitecture.ts
│           ├── generateDocs.ts
│           └── saveToBlob.ts
│
└── components/                 # UI components (shadcn/ui)
```

---

## 🛠 Tech Stack

### **Frontend**
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui**

### **AI & Embeddings**
- **Vercel AI SDK** (generateObject)
- **OpenAI GPT-5-mini** (agents)
- **OpenAI text-embedding-3-small** (1536 dimensions)

### **Storage & Search**
- **Upstash Vector** (semantic search, ~2KB/chunk)
- **Vercel Blob** (wiki storage, MDX files)
- **Vercel Workflow** (orchestration, retries)

### **Code Analysis**
- **tree-sitter** (AST parsing for JS/TS/Python/Go/Rust)
- **Knowledge Graph** (in-memory graph for code relationships)
- **Octokit** (GitHub API)

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
# Required: OpenAI API
OPENAI_API_KEY=sk-...

# Required: Upstash Vector (for search)
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...

# Optional: GitHub API (higher rate limits)
GITHUB_TOKEN=ghp_...

# Auto-added by Vercel (for Blob storage)
BLOB_READ_WRITE_TOKEN=...
```

### **Setup Instructions:**

1. **OpenAI API Key**: https://platform.openai.com/api-keys
2. **Upstash Vector**:
   - Go to https://console.upstash.com/vector
   - Create new index:
     - **Model**: None (we provide embeddings)
     - **Dimensions**: 1536
     - **Metric**: COSINE
   - Copy REST URL and token

3. **GitHub Token** (optional):
   - https://github.com/settings/tokens
   - Select: `public_repo` scope

---

## 🎨 How It Works

### **Wiki Generation Workflow**

```
User enters GitHub URL (e.g., "sindresorhus/is")
           ↓
┌──────────────────────────────────────────────────────────┐
│  Step 1: Fetch Repository                                │
│  • Clone file tree via GitHub API                        │
│  • Filter out tests, node_modules, build artifacts       │
│  • Fetch up to 300 source files                          │
└──────────────────────────────────────────────────────────┘
           ↓
┌────────────────────────────┬─────────────────────────────┐
│  Step 2a: Build RAG Index │ Step 2b: Run Recon Agent   │
│  (PARALLEL)                │ (PARALLEL)                  │
├────────────────────────────┼─────────────────────────────┤
│  • Parse top 150 chunks    │ • Analyze README            │
│  • Generate embeddings     │ • Detect tech stack         │
│  • Truncate code to 3KB    │ • Identify patterns         │
│  • Save to Upstash Vector  │ • Map directory structure   │
└────────────────────────────┴─────────────────────────────┘
           ↓
┌────────────────────────────┬─────────────────────────────┐
│  Step 3a: Features Agent   │ Step 3b: Architecture Agent│
│  (PARALLEL)                │ (PARALLEL)                  │
├────────────────────────────┼─────────────────────────────┤
│  • Top 50 chunks (3KB max) │ • Top 30 chunks (3KB max)   │
│  • Detect user features    │ • Identify patterns         │
│  • Rate importance (1-10)  │ • Explain data flow         │
└────────────────────────────┴─────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────┐
│  Step 4: Generate Documentation (Important Features)    │
│  • Filter features: importance >= 4 only (focus quality)│
│  • For each feature: find relevant code chunks          │
│  • Docs Generator creates MDX with examples (3K tokens) │
│  • Include code citations (file:line)                   │
└──────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────┐
│  Step 5: Save Wiki to Vercel Blob                        │
│  • Generate index.mdx (overview)                         │
│  • Generate feature pages (feature-name.mdx)             │
│  • Store as public blobs                                 │
└──────────────────────────────────────────────────────────┘
           ↓
    ✓ Wiki ready at /wiki/repo-name
    ✓ Searchable via semantic search
```

**Duration:** ~1.5-2 minutes for typical repo (300 files)

### **Performance Optimizations**
1. **Parallel Execution**: Recon + Index building run concurrently (saves 9s)
2. **Limited Embeddings**: Only top 150 chunks embedded (70% faster, 70% cheaper)
3. **Chunk Truncation**: 3KB max per chunk for agents (prevents context overflow)
4. **Parallel Agents**: Features + Architecture run concurrently (saves 30s)
5. **Feature Filtering**: Only document important features (importance ≥ 4)
6. **Increased Parallelism**:
   - GitHub fetching: 50 files/batch (was 20)
   - Embeddings: 10 concurrent batches (was 3)

---

### **Semantic Search Flow**

```
User types: "user authentication"
           ↓
┌──────────────────────────────────────────────────────────┐
│  1. Generate Query Embedding                             │
│  • OpenAI text-embedding-3-small                         │
│  • 1536-dimensional vector                               │
└──────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────┐
│  2. Vector Similarity Search                             │
│  • Query Upstash Vector with embedding                   │
│  • Cosine similarity ranking                             │
│  • Returns top 20 matches                                │
└──────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────┐
│  3. Display Results                                      │
│  • Code snippet (500 chars)                              │
│  • File path + line numbers                              │
│  • Similarity score (% match)                            │
│  • "View on GitHub" link                                 │
└──────────────────────────────────────────────────────────┘
```

**Response time:** < 1 second

---

## 🎯 Core Principles

1. **KISS** - Simple, direct implementations (no over-engineering)
2. **DRY** - Reuse through utilities and shared patterns
3. **Type Safety** - Strict TypeScript, no `any` types
4. **User-Focused** - Document features, not technical layers
5. **Quality** - All code passes lint + type checks

---

## 📊 Architecture Decisions

### **Why Vector Search Only?**
- ✅ Simple, fast, accurate for semantic queries
- ✅ Handles typos and synonyms ("auth" finds "authentication")
- ✅ No complex fusion algorithms needed
- ❌ Removed BM25 hybrid search (added complexity, minimal benefit)
- ❌ Removed reranking (128K context makes it unnecessary)

### **Why Truncate Instead of Compress?**
- ✅ **Speed**: Instant vs 60s for AI compression (100x faster)
- ✅ **Coverage**: 50 chunks × 3KB = 150KB (vs 20 chunks × 2KB = 40KB compressed)
- ✅ **Quality**: First 3KB captures function signatures, logic, JSDoc
- ✅ **Cost**: Free vs API calls for each chunk
- ❌ Compression was too slow (code-summarizer agent took 60s for 20 chunks)
- ❌ Agents need breadth (many examples) > depth (complete implementations)
- 📝 Trade-off: Agents see truncated code, but full code still in Vector for search

### **Why Snippet-Only in Search?**
- ✅ Upstash Vector has 48KB metadata limit
- ✅ Full code (10KB+) exceeds limit
- ✅ 500-char snippets sufficient for preview
- ✅ "View on GitHub" provides full context
- 📝 Future: Hybrid storage (Vector + Blob) for full code on-demand

### **Why Filter Test Files?**
- ✅ Focus on implementation code
- ✅ Faster processing (skip 30-40% of files)
- ✅ Better feature detection (tests don't represent features)
- ✅ Reduced API costs

---

## 💰 Cost Analysis

### **Per Large Repository (~300 files)**
```
GitHub API:        Free (60 req/hour w/o token, 5000/hour with)
Embeddings:        150 chunks × $0.00002 = $0.003 (70% reduction!)
Agent calls:       ~6 calls × $0.15 = $0.90
Total per wiki:    ~$0.90

Monthly costs (10 wikis/month):
OpenAI:            ~$9/month
Upstash Vector:    Free tier (up to 10K vectors)
Vercel Blob:       ~$0.15/month (1GB storage)
Total:             ~$9.15/month

Performance: 3.5 min → 1.5 min (57% faster)
```

---

## ⚠️ Known Limitations

### **Current Constraints:**
1. **No Incremental Updates** - Must regenerate entire wiki for changes
2. **Snippet-Only Search** - 500-char limit (full code on GitHub)
3. **Truncated Code for Agents** - Chunks limited to 3KB to fit context windows
   - Trade-off: Speed & reliability > complete code visibility
   - First 3KB captures signatures, logic, JSDoc (usually sufficient)
4. **Important Features Only** - Only generates docs for importance ≥ 4
   - Trade-off: Quality & speed > comprehensive coverage
5. **No Authentication** - All wikis are public
6. **No Rate Limiting** - Can be abused
7. **No Caching** - Same repo re-analyzed costs same amount
8. **Single Model** - No fallback if OpenAI is down

### **Future Improvements**:
- [ ] Incremental updates with Merkle trees (90% cost reduction)
- [ ] Full code storage (Blob + Vector hybrid)
- [ ] Authentication & user workspaces
- [ ] Caching layer (Redis) for embeddings and agents
- [ ] Model fallbacks (Anthropic, Gemini)
- [ ] Private repo support (user GitHub tokens)
- [ ] Smart code completion for truncated chunks
  - Current: Hard truncate at 3KB (fast, predictable)
  - Future: Intelligent truncation at semantic boundaries (end of function/class)
  - Or: Dynamic chunk sizing based on available context budget

---

## 🧪 Development

### **Commands**
```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server

# Quality checks (must pass before commit)
npm run lint             # ESLint (0 errors allowed)
npx tsc --noEmit        # TypeScript checking

# Testing
npm run test:rag         # Test RAG pipeline
npm run test:github      # Test GitHub fetcher
npm run test:docs        # Test docs generation
```

### **Code Quality Standards**
- ✅ All code passes ESLint (0 errors, 0 warnings)
- ✅ All code passes TypeScript type checking
- ✅ No `any` types (use `unknown` or specific types)
- ✅ Proper error handling with try/catch
- ✅ Clear, concise comments

### **Agent Development Pattern**

Each agent follows strict 4-file structure:

```
lib/agents/[agent-name]/
├── schema.ts      # Zod validation schema
├── types.ts       # Input/Output TypeScript types
├── prompt.ts      # System + User message builders
└── index.ts       # Agent definition with defineAgent()
```

Example:
```typescript
// schema.ts
export const myAgentSchema = z.object({
  result: z.string(),
  confidence: z.number(),
});

// types.ts
export type MyAgentOutput = z.infer<typeof myAgentSchema>;
export interface MyAgentInput { context: RepoContext; }

// prompt.ts
export const SYSTEM_MESSAGE = `You are an expert...`;
export function buildUserMessage(input: MyAgentInput): string { ... }

// index.ts
export const myAgent = defineAgent({
  name: 'my-agent',
  schema: myAgentSchema,
  systemMessage: SYSTEM_MESSAGE,
  buildUserMessage,
});
```

---

## 🚢 Deployment

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard:
# - OPENAI_API_KEY
# - UPSTASH_VECTOR_REST_URL
# - UPSTASH_VECTOR_REST_TOKEN
# - GITHUB_TOKEN (optional)
```

### **Other Platforms**
Requires:
- Node.js 20+
- Support for Vercel Workflow (or alternative orchestration)
- Environment variables configured

---

## 📝 License

MIT

---

**Built with ❤️ using AI-powered development**
