# PDF Chat

Upload PDFs, ask questions, and get cited answers powered by retrieval-augmented generation (RAG).

Built with **Next.js 16**, **Clerk** authentication, **Neon Postgres**, **Pinecone** vector search, and **OpenAI** embeddings + chat.

## Features

- PDF upload and automatic chunking / embedding
- RAG chat with source citations
- Persistent chat history per user
- Dark-themed dashboard with sidebar and settings drawer
- Local file storage (default) or optional Supabase Storage

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | Neon Postgres (`pg`) |
| Vector DB | Pinecone |
| LLM / Embeddings | OpenAI |
| PDF parsing | pdf-parse, LangChain text splitters |
| Styling | Tailwind CSS 4 |

## Project structure

```
ai-web-kit/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # ingest, rag, chat, documents, chats
│   ├── auth/               # Clerk sign-in / sign-up
│   ├── dashboard/          # Main authenticated workspace
│   └── user-profile/       # Clerk account management
├── components/
│   ├── chat/               # Chat UI (messages, input, upload)
│   ├── landing/            # Marketing landing page
│   ├── layout/             # Shell, sidebar, profile menu
│   ├── providers/          # React context (chat, documents, UI)
│   └── settings/           # Settings drawer and panel
├── hooks/                  # Client hooks (useChat)
├── lib/                    # Server utilities (db, rag, env, storage)
├── scripts/                # DB migration, Pinecone setup, health checks
├── supabase/migrations/    # SQL schema (runs on Neon via npm run db:migrate)
├── proxy.ts                # Clerk middleware
└── .env.example            # Environment variable template
```

## Prerequisites

- Node.js 20+
- Accounts / API keys for:
  - [Clerk](https://clerk.com)
  - [Neon](https://neon.tech) (Postgres)
  - [Pinecone](https://pinecone.io)
  - [OpenAI](https://platform.openai.com)

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-web-kit
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `OPENAI_API_KEY` | OpenAI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name (e.g. `ai-web-kit`) |
| `DATABASE_URL` | Neon Postgres connection string |

See `.env.example` for optional tuning (RAG thresholds, models, storage).

### 3. Database migration

```bash
npm run db:migrate
```

Verify connectivity:

```bash
npm run db:check
```

### 4. Pinecone index

Create the vector index (1536 dimensions for `text-embedding-3-small`):

```bash
npm run pinecone:setup
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply SQL migrations to Neon |
| `npm run db:check` | Test database connection |
| `npm run pinecone:setup` | Create Pinecone index |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/ingest` | POST | Upload and index a PDF |
| `/api/rag` | POST | RAG query with citations |
| `/api/chat` | POST | Streaming chat completion |
| `/api/documents` | GET/DELETE | List or remove documents |
| `/api/chats` | GET/POST | List or create chats |
| `/api/chats/[chatId]` | GET/PATCH/DELETE | Chat messages and metadata |

## Storage

By default, uploaded PDFs are stored locally in `.uploads/` (gitignored).

To use Supabase Storage instead, set:

```env
USE_SUPABASE_STORAGE=true
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Deployment

1. Deploy to [Vercel](https://vercel.com) or any Node.js host.
2. Add all environment variables from `.env.example`.
3. Run `npm run db:migrate` against your production `DATABASE_URL`.
4. Ensure `LOCAL_STORAGE_DIR` is writable, or enable Supabase Storage for production file persistence.

## Security notes

- Never commit `.env.local` or API keys.
- Rotate any credentials that were stored in plaintext locally.
- Clerk protects `/dashboard` and API routes via `proxy.ts`.

## License

MIT — see [LICENSE](./LICENSE).
