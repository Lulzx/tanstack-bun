# TanStack Router + Bun (No Vite, No Nitro)

A minimal, novel setup for TanStack Router with SSR using **only Bun's native APIs**.

## What's Different?

| Traditional Stack | This Setup |
|-------------------|------------|
| Vite (bundler + dev server) | Bun.build() |
| Nitro (server framework) | Bun.serve() |
| vite.config.ts | None needed |
| Complex plugin system | Zero plugins |

## Features

- ⚡ **SSR** via `renderToString` 
- 🔄 **Client hydration** with React 19
- 📦 **Bun's native bundler** (no esbuild/rollup)
- 🔥 **Hot reload** in dev mode (`--hot`)
- 🚀 **Single runtime** for bundling + serving
- 📁 **Code-based routing** (explicit, no magic)

## Project Structure

```
├── server.tsx        # Bun.serve() SSR server
├── build.ts          # Production bundler
├── src/
│   ├── routes.tsx    # Route definitions + components
│   └── client.tsx    # Client hydration entry
└── dist/             # Built client bundle
```

## Usage

```bash
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
4. Renders with `renderToString`
5. Serves HTML + client bundle via `Bun.serve()`

### Client (src/client.tsx)
1. Creates router with browser history (default)
2. Hydrates server-rendered HTML with `hydrateRoot`

### Routes (src/routes.tsx)
- Code-based routing (no file-based conventions)
- Shared between server and client
- Supports loaders for data fetching

## Limitations

- No streaming SSR (would need more complexity)
- No file-based routing (by design - explicit is better)
- No HMR for server code (restart required)
- Large bundle in dev mode (not minified)

## Why?

Sometimes you don't need the complexity of Vite + Nitro. This setup proves you can have full SSR with TanStack Router using just Bun.
