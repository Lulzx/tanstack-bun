import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getServerTime, echo } from "./api";
import {
  QueryDemo,
  TableDemo,
  FormDemo,
  VirtualDemo,
  StoreDemo,
  PacerDemo,
  DBDemo,
  ApiDemo,
  SSRDemo,
  FullSSRPage,
  ClientOnlyPage,
  DataOnlyPage,
  StreamingPage,
} from "./demos";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
});

// Root layout component with full HTML document
function RootLayout() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TanStack Suite + Bun SSR</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; line-height: 1.6; }
          nav { padding: 0.75rem 2rem; background: #1a1a1a; display: flex; gap: 1rem; border-bottom: 1px solid #333; flex-wrap: wrap; }
          nav a { color: #60a5fa; text-decoration: none; font-weight: 500; transition: color 0.2s; font-size: 0.9rem; }
          nav a:hover { color: #93c5fd; }
          nav a.active { color: #fafafa; }
          main { padding: 2rem; max-width: 900px; margin: 0 auto; }
          h1 { margin-bottom: 1.5rem; font-size: 2rem; }
          h2 { margin-bottom: 1rem; font-size: 1.5rem; color: #e5e5e5; }
          h3 { margin-bottom: 0.5rem; font-size: 1.1rem; }
          .card { background: #1a1a1a; padding: 1.5rem; border-radius: 12px; margin: 1rem 0; border: 1px solid #333; }
          .card:hover { border-color: #444; }
          ul { padding-left: 1.5rem; }
          li { margin: 0.5rem 0; }
          code { background: #262626; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.9em; }
          .badge { display: inline-block; background: #16a34a; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
          .muted { color: #a1a1aa; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
        `,
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <nav>
            <Link to="/" activeProps={{ className: "active" }}>
              Home
            </Link>
            <Link to="/query" activeProps={{ className: "active" }}>
              Query
            </Link>
            <Link to="/table" activeProps={{ className: "active" }}>
              Table
            </Link>
            <Link to="/form" activeProps={{ className: "active" }}>
              Form
            </Link>
            <Link to="/virtual" activeProps={{ className: "active" }}>
              Virtual
            </Link>
            <Link to="/store" activeProps={{ className: "active" }}>
              Store
            </Link>
            <Link to="/pacer" activeProps={{ className: "active" }}>
              Pacer
            </Link>
            <Link to="/db" activeProps={{ className: "active" }}>
              DB
            </Link>
            <Link to="/api-routes" activeProps={{ className: "active" }}>
              API Routes
            </Link>
            <Link to="/server-fn" activeProps={{ className: "active" }}>
              Server Fn
            </Link>
            <Link to="/ssr-demo" activeProps={{ className: "active" }}>
              SSR
            </Link>
          </nav>
          <main>
            <Outlet />
          </main>
        </QueryClientProvider>
        <script type="module" src="/client.js" />
      </body>
    </html>
  );
}

// Home page
function HomePage() {
  return (
    <div>
      <h1>TanStack Suite + Pure Bun</h1>
      <div className="card">
        <span className="badge">No Vite</span>{" "}
        <span className="badge">No Nitro</span>{" "}
        <span className="badge">8 TanStack libs</span>
        <p style={{ marginTop: "1rem" }}>
          Full SSR with the complete TanStack ecosystem using only Bun.
        </p>
      </div>

      <h2>TanStack Libraries</h2>
      <div className="grid">
        <Link to="/query" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Query</h3>
            <p className="muted">Async state management</p>
          </div>
        </Link>
        <Link to="/table" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Table</h3>
            <p className="muted">Headless data tables</p>
          </div>
        </Link>
        <Link to="/form" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Form</h3>
            <p className="muted">Type-safe forms</p>
          </div>
        </Link>
        <Link to="/virtual" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Virtual</h3>
            <p className="muted">Virtualized lists</p>
          </div>
        </Link>
        <Link to="/store" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Store</h3>
            <p className="muted">Reactive state</p>
          </div>
        </Link>
        <Link to="/pacer" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Pacer</h3>
            <p className="muted">Rate limiting & queues</p>
          </div>
        </Link>
        <Link to="/db" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>DB</h3>
            <p className="muted">Client-side database</p>
          </div>
        </Link>
        <Link to="/api-routes" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>API Routes</h3>
            <p className="muted">REST endpoints</p>
          </div>
        </Link>
        <Link to="/server-fn" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Server Functions</h3>
            <p className="muted">RPC to server</p>
          </div>
        </Link>
        <Link to="/ssr-demo" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>SSR Features</h3>
            <p className="muted">Selective SSR & streaming</p>
          </div>
        </Link>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Stack</h2>
      <div className="card">
        <ul>
          <li><strong>Bundler:</strong> <code>Bun.build()</code></li>
          <li><strong>Server:</strong> <code>Bun.serve()</code></li>
          <li><strong>Routing:</strong> TanStack Router</li>
          <li><strong>Rendering:</strong> React 19 SSR + hydration</li>
        </ul>
      </div>
    </div>
  );
}

// Server functions demo
function ServerFnPage() {
  const [serverTime, setServerTime] = useState<{ time: string; timezone: string } | null>(null);
  const [echoResult, setEchoResult] = useState<{ original: string; reversed: string } | null>(null);
  const [message, setMessage] = useState("Hello Bun!");
  const [loading, setLoading] = useState(false);

  const fetchTime = async () => {
    setLoading(true);
    const result = await getServerTime();
    setServerTime(result);
    setLoading(false);
  };

  const sendEcho = async () => {
    setLoading(true);
    const result = await echo({ message });
    setEchoResult(result);
    setLoading(false);
  };

  return (
    <div>
      <h1>Server Functions</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        RPC-style calls from client to server
      </p>

      <div className="card">
        <h3>Get Server Time</h3>
        <p className="muted" style={{ margin: "0.5rem 0" }}>
          Calls <code>getServerTime()</code> on the server
        </p>
        <button
          onClick={fetchTime}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
            marginTop: "0.5rem",
          }}
        >
          {loading ? "Loading..." : "Fetch Time"}
        </button>
        {serverTime && (
          <div style={{ marginTop: "1rem", background: "#262626", padding: "1rem", borderRadius: "6px" }}>
            <div><strong>Time:</strong> {serverTime.time}</div>
            <div><strong>Timezone:</strong> {serverTime.timezone}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Echo with Transform</h3>
        <p className="muted" style={{ margin: "0.5rem 0" }}>
          Calls <code>echo(message)</code> - server reverses the string
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem",
              background: "#262626",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "white",
            }}
          />
          <button
            onClick={sendEcho}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            Echo
          </button>
        </div>
        {echoResult && (
          <div style={{ marginTop: "1rem", background: "#262626", padding: "1rem", borderRadius: "6px" }}>
            <div><strong>Original:</strong> {echoResult.original}</div>
            <div><strong>Reversed:</strong> {echoResult.reversed}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Define routes
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const queryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/query",
  component: QueryDemo,
});

const tableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/table",
  component: TableDemo,
});

const formRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/form",
  component: FormDemo,
});

const virtualRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/virtual",
  component: VirtualDemo,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/store",
  component: StoreDemo,
});

const pacerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pacer",
  component: PacerDemo,
});

const dbRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/db",
  component: DBDemo,
});

const apiRoutesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/api-routes",
  component: ApiDemo,
});

const serverFnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/server-fn",
  component: ServerFnPage,
});

// SSR Demo routes
const ssrDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ssr-demo",
  component: SSRDemo,
});

const fullSSRRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ssr-demo/full-ssr",
  component: FullSSRPage,
});

const clientOnlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ssr-demo/client-only",
  component: ClientOnlyPage,
});

const dataOnlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ssr-demo/data-only",
  component: DataOnlyPage,
});

const streamingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ssr-demo/streaming",
  component: StreamingPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  queryRoute,
  tableRoute,
  formRoute,
  virtualRoute,
  storeRoute,
  pacerRoute,
  dbRoute,
  apiRoutesRoute,
  serverFnRoute,
  ssrDemoRoute,
  fullSSRRoute,
  clientOnlyRoute,
  dataOnlyRoute,
  streamingRoute,
]);

// Factory to create router instances
export function createAppRouter(options?: { url?: string; isServer?: boolean }) {
  const history = options?.url
    ? createMemoryHistory({ initialEntries: [options.url] })
    : undefined;

  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
    // Disable Suspense wrapper during SSR to avoid hydration mismatch
    defaultPendingComponent: undefined,
  });
}

// Type registration
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
