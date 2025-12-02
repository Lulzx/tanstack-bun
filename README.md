# TanStack Suite + Bun (No Vite, No Nitro)

A minimal, novel setup for TanStack Router with SSR using only Bun's native APIs. Includes 8 TanStack libraries with TanStack Start-like features.

## What's Different?

| Traditional Stack | This Setup |
|-------------------|------------|
| Vite (bundler + dev server) | Bun.build() |
| Nitro (server framework) | Bun.serve() |
| vite.config.ts | None needed |
| Complex plugin system | Zero plugins |

## TanStack Libraries Included

- **Router** - Type-safe routing with SSR
- **Query** - Async state management
- **Table** - Headless data tables
- **Form** - Type-safe forms with validation
- **Virtual** - Virtualized lists (10k+ items)
- **Store** - Reactive state management
- **Pacer** - Rate limiting & async queues
- **DB** - Client-side database (placeholder)

## Features

### Core
- **Streaming SSR** via `renderToReadableStream`
- **Client hydration** with React 19
- **Hot reload** in dev mode (`--hot`)
- **Single runtime** for bundling + serving

### Server Functions (TanStack Start-like)
- Fluent API: `createServerFn().validator().middleware().handler()`
- Zod validation for inputs
- Middleware system with `createMiddleware()`
- Request/response context utilities
- Cookie support (`getCookie`, `setCookie`)
- Redirects and errors (`redirect()`, `notFound()`)
- FormData support with file uploads

### API Routes
- REST endpoints with `defineApiRoute()`
- Path parameters (`/api/posts/:id`)
- Full CRUD operations
- JSON helpers (`json()`, `apiError()`, `parseBody()`)

### Selective SSR
- **Full SSR** (default) - Server renders complete HTML
- **Client-only** (`ssr: false`) - Server sends shell, client renders
- **Data-only** (`ssr: 'data-only'`) - Server fetches data, client renders

## Project Structure

```
├── server.tsx              # Bun.serve() SSR server
├── build.ts                # Production bundler
├── src/
│   ├── routes.tsx          # Route definitions + components
│   ├── client.tsx          # Client hydration entry
│   ├── server-fn.ts        # Server functions (TanStack Start-like)
│   ├── api-routes.ts       # REST API route system
│   ├── api.ts              # Server functions & API definitions
│   ├── ssr.ts              # Selective SSR utilities
│   ├── hooks/
│   │   ├── use-server-fn.ts    # useServerFn hook
│   │   └── use-deferred.ts     # Deferred data hooks
│   └── demos/              # Demo components for each library
└── dist/                   # Built client bundle
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

## Demo Routes

| Route | Description |
|-------|-------------|
| `/` | Home with overview |
| `/query` | TanStack Query demo |
| `/table` | TanStack Table demo |
| `/form` | TanStack Form demo |
| `/virtual` | TanStack Virtual demo |
| `/store` | TanStack Store demo |
| `/pacer` | TanStack Pacer demo |
| `/db` | TanStack DB info |
| `/api-routes` | REST API demo |
| `/server-fn` | Server functions demo |
| `/ssr-demo` | SSR modes demo |

## API Examples

### Server Functions

```typescript
// Define with validation and middleware
export const echo = createServerFn()
  .validator(z.object({ message: z.string() }))
  .middleware(logMiddleware)
  .handler(async ({ input }) => {
    return { reversed: input.message.split('').reverse().join('') };
  });

// Call from client or server
const result = await echo({ message: 'Hello' });
```

### API Routes

```typescript
// REST endpoint with path params
defineApiRoute('/api/posts/:id', {
  GET: async ({ params }) => {
    const post = posts.find(p => p.id === parseInt(params.id));
    return post ? json(post) : apiError(404, 'Not found');
  },
  DELETE: async ({ params }) => {
    // Delete logic
    return new Response(null, { status: 204 });
  },
});
```

### Selective SSR

```typescript
// In server.tsx
setRouteSSRConfig('/admin', { ssr: false });        // Client-only
setRouteSSRConfig('/dashboard', { ssr: 'data-only' }); // Data prefetch only
```

## REST API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | Health check |
| `/api/posts` | GET, POST | List/create posts |
| `/api/posts/:id` | GET, PUT, DELETE | Single post CRUD |
| `/api/users` | GET, POST | List/create users |
| `/api/users/:id` | GET, PUT, DELETE | Single user CRUD |
| `/api/echo` | GET, POST | Echo for testing |

## How It Works

### Server (server.tsx)
1. Bundles client with `Bun.build()` on-demand
2. Creates router with `createMemoryHistory` for SSR
3. Checks SSR mode for route (full/client-only/data-only)
4. Renders with `renderToReadableStream` (streaming)
5. Handles server functions at `/_server-fn/:name`
6. Handles API routes at `/api/*`

### Client (src/client.tsx)
1. Creates router with browser history
2. Hydrates server-rendered HTML with `hydrateRoot`
3. Server functions become transparent `fetch()` calls
4. Event handlers are attached during hydration

## TanStack Start vs This Setup

**TanStack Start** is the official full-stack framework requiring Vite and Nitro.

**This setup** provides similar features using only Bun:
- Server functions with validators/middleware
- API routes with path parameters
- Selective SSR control
- Full control over SSR behavior
- Simpler mental model

## Technical Notes

### SSR Hydration
- Server functions use deterministic naming for consistent server/client matching
- Router is configured to avoid Suspense boundary mismatches during hydration
- QueryClient is shared across requests (consider per-request instances for production)

## Limitations

- No automatic server function code splitting
- No file-based routing generation
- No HMR for server code (restart required)
- Larger dev bundle (not minified)

## Why?

Sometimes you don't need Vite + Nitro complexity. This proves you can have full SSR with the complete TanStack ecosystem using just Bun.
