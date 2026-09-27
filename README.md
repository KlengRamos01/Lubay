# LubayLub.AI (Lubay-Lubay) — Mental Health RAG Chat

A streaming chat application for mental health guidance, built with [Next.js 15](https://nextjs.org/), the [Vercel AI SDK](https://sdk.vercel.ai/), and [Upstash Vector](https://upstash.com/docs/vector). The app uses Retrieval-Augmented Generation (RAG) to provide evidence-based responses from a mental health foundation guide.

## About the Name

**Lubay-Lubay** means **to sway, bend, shake, or move rhythmically back and forth**. It represents **flexibility and resilience**—much like a bamboo tree that bends during a strong storm without breaking.

This is the spirit of **LubayLub.AI**: encouraging users to stay flexible and resilient in the face of life's challenges, bending rather than breaking when stress and anxiety arise.

## What LubayLub.AI Does

LubayLub.AI is an AI-powered mental health companion that helps users find reliable information about stress, anxiety, and mental wellness. Instead of searching through lengthy documents or relying on generic internet advice, users can ask natural questions and receive immediate, evidence-based responses.

**For users**, Lubay-Lub.AI works like a knowledgeable friend who has read the entire Mental Health Foundation guide. You type a question—whether it's about managing work stress, understanding anxiety symptoms, or finding coping strategies—and Lubay-Lub.AI pulls relevant information from trusted sources, explaining it in plain language.

**Key benefits:**

- **Instant answers**: No more scrolling through PDFs or websites—get specific responses to your questions in seconds
- **Source transparency**: Every answer shows exactly where the information came from, including page numbers and relevance scores, so you can verify the guidance
- **Evidence-based**: Responses are grounded in the Mental Health Foundation's official guide, not random internet advice
- **Always available**: Access mental health information anytime, anywhere, without appointments or wait times
- **Non-judgmental**: Ask anything without fear of judgment—the AI provides supportive, compassionate responses

**Example use cases:**

- "What are the early signs of burnout?"
- "How can I explain my anxiety to my manager?"
- "What breathing techniques help with panic attacks?"
- "How do I build a better work-life balance?"

Each response includes expandable source citations so you can dive deeper into the original guide when needed.

## Features

- **Streaming Chat**: Real-time token-by-token responses using Vercel AI SDK
- **RAG-as-Tool-Call**: The AI model decides when to retrieve information from the knowledge base
- **Source Citations**: Expandable source cards showing page numbers, similarity scores, and retrieved text
- **Markdown Support**: Rich text rendering with GFM support in assistant responses
- **PDF Processing**: Automatic chunking and embedding of PDF documents
- **Serverless Deployment**: Ready for Vercel deployment with edge-compatible architecture

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **AI SDK** | Vercel AI SDK 4.x |
| **LLM** | OpenAI GPT-4o-mini |
| **Embeddings** | OpenAI text-embedding-3-small |
| **Vector DB** | Upstash Vector |
| **Styling** | Tailwind CSS |
| **PDF Parsing** | pdf-parse |
| **Validation** | Zod |

## Project Structure

```
14A-nextjs-rag/
├── app/
│   ├── globals.css                    # Global styles with Tailwind
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Chat UI with useChat hook
│   └── api/chat/
│       └── route.ts                   # RAG route handler with tool calling
├── lib/
│   └── seed.ts                        # PDF chunking and vector upsert script
├── data/
│   └── how-to-manage-and-reduce-stress.pdf  # Mental health guide
├── steps/                             # Incremental development snapshots
│   ├── step2-plain-chat/              # Basic streaming chat
│   ├── step4-rag-as-tool/             # RAG with tool calling
│   └── step5-sources/                 # Source display UI
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.mjs
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys:
#   OPENAI_API_KEY
#   UPSTASH_VECTOR_REST_URL
#   UPSTASH_VECTOR_REST_TOKEN

# 3. Seed the vector database
npm run seed
```

The seed script reads the PDF, chunks it into 120-character segments with 60-character overlap, embeds each chunk, and upserts to Upstash Vector. Re-running is idempotent.

## How It Works

1. **PDF Processing** (`lib/seed.ts`): Extracts text from PDF, chunks it, and stores embeddings in Upstash Vector
2. **Chat Interface** (`app/page.tsx`): React component using `useChat` hook for streaming messages
3. **RAG Handler** (`app/api/chat/route.ts`): 
   - Receives user messages
   - AI model decides whether to call `getInformation` tool
   - Tool performs vector search and returns relevant chunks
   - Response streams back with source citations

## Running Locally

```bash
npm run dev
# Open http://localhost:3000
```

Example queries:
- "What are the main causes of stress?"
- "How can I manage anxiety?"
- "What coping strategies are recommended?"

## Deployment

```bash
npm i -g vercel
vercel link
vercel env add OPENAI_API_KEY
vercel env add UPSTASH_VECTOR_REST_URL
vercel env add UPSTASH_VECTOR_REST_TOKEN
vercel --prod
```

The vector index is seeded locally and persists in Upstash—no re-seeding needed after deployment.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for LLM and embeddings |
| `UPSTASH_VECTOR_REST_URL` | Upstash Vector REST endpoint |
| `UPSTASH_VECTOR_REST_TOKEN` | Upstash Vector authentication token |


