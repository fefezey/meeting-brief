# Doküman Analiz — Meeting Prep for Long Reports

[![CI](https://github.com/fefezey/meeting-brief/actions/workflows/ci.yml/badge.svg)](https://github.com/fefezey/meeting-brief/actions/workflows/ci.yml)

**[Türkçe](./README.tr.md)** · English

You have a 60-page quarterly report and a meeting in 10 minutes. This tool reads
it and hands you a briefing: what it says, what's risky, and what to ask.

![Document view](./docs/screenshots/document-light.png)

---

## Why not just another "chat with PDF" app

Most PDF tools wait for you to know what to ask. This one **tells you what to
ask** — because the person walking into a meeting usually doesn't know yet.

| Typical PDF chat | This |
| --- | --- |
| You must know the right question | Generates the questions worth asking |
| Neutral summary | Surfaces **risks** explicitly, with severity |
| Q&A only | Briefing first, chat second |

Upload → you immediately get a summary, the key points, the numbers that matter,
flagged risks, and a list of sharp questions for the meeting. Chat is there when
you need to dig deeper.

---

## Features

- **Upload** PDFs by click or drag-and-drop (32 MB / 600 pages, validated server-side)
- **Auto-briefing** — summary, key points, key figures, risks with severity, suggested questions
- **Chat** with the document, streamed token by token
- **Scanned-PDF detection** — warns when a file is images rather than text
- **Background analysis** — upload returns in ~1s; results appear when ready
- **Light / dark theme**, no flash on load

---

## How it works

```
Browser                     Server                        Claude
   │                          │                             │
   ├── upload PDF ───────────►│                             │
   │                          ├─ validate (type/size/pages) │
   │                          ├─ extract text (page count,  │
   │                          │   scanned detection)        │
   │                          ├─ persist to disk            │
   │                          ├─ start analysis (no await) ─┼──► structured
   │◄── redirect (~1s) ───────┤                             │    output
   │                          │                             │
   ├── poll every 2s ────────►│◄────────────────────────────┤
   │◄── "ready" ──────────────┤                             │
   │                          │                             │
   ├── ask question ─────────►├─────────────────────────────┼──► streamed
   │◄── streamed answer ──────┤◄────────────────────────────┤    response
```

---

## Engineering decisions

The parts I'd want reviewed.

### Full context, not RAG

The obvious build is chunk → embed → vector store → retrieve. I deliberately
didn't.

Claude's context window holds ~1500 pages; a corporate report is 30–100. Chunking
actively *hurts* here — half the product's value is whole-document questions
("what's the biggest risk in this report?"), which retrieval fragments. Prompt
caching makes re-sending the document cheap after the first call, and Claude
reads PDFs natively, so tables and charts survive as visual structure rather than
being flattened into text.

RAG earns its complexity at multi-document scale. Not here, not yet.

### Provider abstraction — mock and real are interchangeable

`generateAnalysis()` and `streamChatAnswer()` are the only entry points. Both
pick between a mock and the real Claude implementation at runtime based on
whether credentials exist — an `ANTHROPIC_API_KEY`, or an OAuth profile from
`ant auth login`. Same signature, same return type.

This meant the entire UI was built and tested before spending a cent on API
calls, and the switch to real inference is a config change, not a refactor.
`MOCK_DELAY_MS` lets the mock simulate slow inference so loading states get
exercised.

### Long work doesn't block the request

Real analysis takes 60–120s. Blocking the upload response means a blank screen
and a likely gateway timeout. Instead the upload persists the file, kicks off
analysis without awaiting it, and redirects immediately (measured: ~1s while
analysis ran for 10s). The document page polls until the status flips.

*Known limit:* this assumes a single long-lived server process. Serverless
deployment needs a real job queue.

### Streaming, both ends

Server builds a `ReadableStream` and enqueues chunks as the model produces them;
the client reads with `getReader()` and `TextDecoder({ stream: true })` — the
streaming flag matters because multi-byte characters split across chunk
boundaries.

Measured: first byte at 0.10s, full answer at 1.70s. Same total, very different
perceived speed.

### Storage behind an interface

Documents live on disk (`.data/`) as PDF + JSON. Nothing outside
`lib/server/storage/` knows that — callers only see `listDocuments()`,
`getAnalysis()`, `appendMessage()`. Swapping in Postgres changes one file.

### Tests that actually catch things

19 unit tests (Vitest, ~200ms) plus 4 end-to-end tests (Playwright) covering the
full flow: upload → briefing → chat → delete, plus theme persistence and
rejection of non-PDF files. CI runs both on every push.

The unit tests target pure functions extracted specifically for testability —
`isMetadataFile()`, `hasEnoughText()`, orphan detection. One is a regression
test for a bug that shipped: a filter written as "exclude `.analysis.json`"
silently broke when chat added `.messages.json` files, which were then parsed as
document records and crashed the index page. The fix inverted it to
"only accept `<id>.json`", and the test proves the old logic fails.

E2E flakiness was resolved rather than papered over. `networkidle` proved
unreliable against a Vite dev server (the HMR websocket never settles), so the
layout stamps `data-hydrated="true"` once hydration completes and tests wait on
that. Each run uploads a uniquely-named file so leftover state from a previous
run can't collide.

### Secrets can't leak by accident

Anything under `lib/server/` is compile-time blocked from client bundles by
SvelteKit, and the API key is read through `$env/dynamic/private`. Importing it
from a component fails the build rather than shipping the key to the browser.

---

## Running it

Requires Node 22.12+ (`.nvmrc` pins 22.23.1).

```bash
npm install
cp .env.example .env     # optional — runs on mock data without a key
npm run dev
```

Open http://localhost:5177. With no credentials the app runs in mock mode with a
banner saying so. To switch to real inference, either run `ant auth login`
(OAuth — nothing is written into the project) or set `ANTHROPIC_API_KEY`. Either
way: restart, no code changes.

| Script | |
| --- | --- |
| `npm run dev` | dev server |
| `npm run check` | type-check (`svelte-check`) |
| `npm run build` | production build |
| `npm run test` | unit + end-to-end tests |
| `npm run test:unit` | unit tests only (Vitest, ~200ms) |
| `npm run test:e2e` | end-to-end tests (Playwright) |
| `npm run analyze -- file.pdf` | analyze a PDF from the terminal |
| `npm run screenshots` | regenerate README screenshots |

---

## Project layout

```
src/
├── routes/                        URLs
│   ├── +page.svelte/.server.ts    upload + document list
│   └── documents/[id]/
│       ├── +page.svelte           split view: PDF | briefing + chat
│       ├── file/+server.ts        serves PDF bytes
│       └── chat/+server.ts        streaming chat endpoint
├── hooks.server.ts                startup: sweep orphaned files
└── lib/
    ├── components/                UI (shadcn-svelte + chat panel)
    ├── types/                     shared shapes (Zod schemas)
    └── server/                    never reaches the browser
        ├── storage/               disk persistence
        ├── pdf/                   text extraction, scanned detection
        ├── analysis/              briefing generation (mock ↔ Claude)
        ├── chat/                  streaming answers (mock ↔ Claude)
        └── anthropic/             client, prompts, config
e2e/                               Playwright end-to-end tests
```

**Stack:** SvelteKit · TypeScript · Tailwind v4 · shadcn-svelte · Zod ·
Anthropic SDK (Claude Opus 4.8) · unpdf

---

## Known limitations

Listed because they're real, not because they're hidden.

- **Local storage only.** Single-user, no auth. Supabase schema is written
  (`supabase/schema.sql`) but not wired up.
- **Background jobs assume one server process.** Fine locally, needs a queue on
  serverless.
- **Citations aren't surfaced yet.** The API returns page-level sources; the UI
  doesn't render them. Requires replacing the `<iframe>` viewer with pdf.js so
  clicking a citation can jump to the page.
- **No visual regression testing.** Screenshots are generated, not diffed.

## Roadmap

1. Wire up real inference and tune the analysis prompts against real reports
2. Render citations; jump-to-page via pdf.js
3. Supabase for persistence and multi-user
4. Deploy a live demo
