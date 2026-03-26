# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # Install deps + Prisma setup + migrations (first-time)
npm run dev         # Start dev server with Turbopack
npm run build       # Production build
npm run lint        # Run ESLint
npm run test        # Run Vitest
npm run db:reset    # Force reset Prisma database
```

Run a single test file: `npx vitest run src/lib/__tests__/file-system.test.ts`

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in chat; Claude generates code using tool calls that modify a virtual file system; the result renders live in an iframe.

### Data Flow

1. User sends a chat message → `/api/chat/route.ts`
2. The route calls `streamText()` (Vercel AI SDK) with Claude and two tools: `str_replace_editor` (create/edit files) and `file_manager` (file operations)
3. Tool calls execute server-side, modifying the `VirtualFileSystem` held in chat state
4. The client-side `ChatContext` (`src/lib/contexts/chat-context.tsx`) receives streamed tool results and updates `FileSystemContext`
5. `PreviewFrame` picks up file changes, transforms JSX via Babel Standalone, and renders the result in an iframe using a blob URL + import map

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) holds all generated files in memory — no disk I/O. It serializes to/from JSON for storage in the `Project.data` DB column. The AI always generates `/App.jsx` as the entry point; the preview auto-discovers this.

### AI Provider

`src/lib/provider.ts` implements `LanguageModelV1` with two modes:
- **Real**: Uses `@ai-sdk/anthropic` (requires `ANTHROPIC_API_KEY` in `.env`)
- **Mock**: Returns pre-built demo components without an API key — useful for local dev

### State Management

Two React contexts coordinate all runtime state:
- `FileSystemContext` — owns the `VirtualFileSystem` instance; exposes file CRUD
- `ChatContext` — wraps Vercel AI SDK's `useChat()`; after each AI response it flushes tool-call results into `FileSystemContext` and persists to the DB

### Database

Prisma + SQLite (`prisma/dev.db`). Two models:
- `User` — email/password auth, JWT sessions via `jose` (7-day HTTP-only cookies)
- `Project` — stores `messages` (chat history JSON) and `data` (serialized VFS JSON)

Generated Prisma client lives in `src/generated/prisma`.

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data.

### UI Layout

`src/app/main-content.tsx` renders a resizable split pane:
- **Left (35%)**: Chat — `MessageList` + `MessageInput`
- **Right (65%)**: Tabs for Preview (`PreviewFrame` iframe) and Code (`FileTree` + Monaco `CodeEditor`)

### JSX Transformation

`src/lib/transform/jsx-transformer.ts` uses Babel Standalone to convert generated JSX to executable JS at runtime. Output is a blob URL loaded into the preview iframe. An import map resolves `react`, `react-dom`, and Tailwind CDN.

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json` and Vitest).

## Code Style

Comment sparingly. Only add comments to complex or non-obvious code.
