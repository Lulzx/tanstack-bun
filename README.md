# TanStack Router + Bun (No Vite, No Nitro)

A minimal setup for TanStack Router with SSR using **only Bun's native APIs**.

## What's Different?

| Traditional Stack | This Setup |
|-------------------|------------|
| Vite (bundler + dev server) | Bun.build() |
| Nitro (server framework) | Bun.serve() |
| vite.config.ts | None needed |
| Complex plugin system | Zero plugins |

## Features

- **Streaming SSR** via `renderToReadableStream`
- **Client hydration** with React 19
- **Server functions** - type-safe RPC pattern
- **Bun's native bundler** (no esbuild/rollup)
- **Hot reload** in dev mode (`--hot`)
- **Single runtime** for bundling + serving
- **Code-based routing** (explicit, no magic)

## Project Structure

```
├── server.tsx          # Bun.serve() SSR server
├── build.ts            # Production bundler
├── src/
│   ├── routes.tsx      # Route definitions + components
│   ├── client.tsx      # Client hydration entry
│   ├── server-fn.ts    # Server functions utility
│   └── api.ts          # Server function definitions
└── dist/               # Built client bundle
```

## Usage

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun run dev

# Production build
bun run build

# Production server
bun run start
```

## How It Works

### Server (server.tsx)
1. Uses `Bun.build()` to bundle client on-demand
2. Creates router with `createMemoryHistory` for SSR
3. Waits for `router.load()` to fetch loader data
4. Renders with `renderToReadableStream` (streaming)
5. Serves HTML + client bundle via `Bun.serve()`
6. Handles server function RPC at `/_server-fn`

### Client (src/client.tsx)
1. Creates router with browser history (default)
2. Hydrates server-rendered HTML with `hydrateRoot`
3. Server functions transparently become `fetch()` calls

### Routes (src/routes.tsx)
- Code-based routing (no file-based conventions)
- Shared between server and client
- Supports loaders for data fetching

### Server Functions (src/server-fn.ts)
```typescript
// Define a server function
export const getServerTime = createServerFn("getServerTime", async () => {
  return { time: new Date().toISOString() };
});

// Call it from anywhere (works on server or client)
const result = await getServerTime();
```

## Routes Demo

| Route | Description |
|-------|-------------|
| `/` | Home page with stack overview |
| `/about` | About page |
| `/posts` | Posts with data loader (SSR prefetch) |
| `/counter` | Client-side state demo |
| `/server-fn` | Server functions demo |

## TanStack Start vs This Setup

**TanStack Start** is the official full-stack framework that requires Vite and Nitro. It provides:
- Automatic code transforms for server functions
- File-based routing with type generation
- Built-in deployment adapters
- Advanced streaming/suspense patterns

**This setup** is a lightweight alternative using only TanStack Router:
- Manual server function implementation
- Code-based routing (more explicit)
- Direct Bun APIs (simpler mental model)
- Full control over SSR behavior

## Limitations

- No automatic server function code splitting
- No file-based routing generation
- No HMR for server code (restart required)
- Larger dev bundle (not minified)

## Why?

Sometimes you don't need the complexity of Vite + Nitro. This setup proves you can have full SSR with TanStack Router using just Bun.
