import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Link,
  Outlet,
} from "@tanstack/react-router";

// Root layout component
function RootLayout() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TanStack + Bun (No Vite)</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fafafa; }
          nav { padding: 1rem 2rem; background: #1a1a1a; display: flex; gap: 1rem; }
          nav a { color: #60a5fa; text-decoration: none; }
          nav a:hover { text-decoration: underline; }
          main { padding: 2rem; max-width: 800px; margin: 0 auto; }
          h1 { margin-bottom: 1rem; }
          .card { background: #1a1a1a; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
        `,
          }}
        />
      </head>
      <body>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/posts">Posts</Link>
        </nav>
        <main>
          <Outlet />
        </main>
        <script type="module" src="/client.js" />
      </body>
    </html>
  );
}

// Page components
function HomePage() {
  return (
    <div>
      <h1>🚀 TanStack Router + Bun</h1>
      <div className="card">
        <p>
          <strong>Zero Vite. Zero Nitro.</strong>
        </p>
        <p style={{ marginTop: "0.5rem", color: "#a1a1aa" }}>
          Pure Bun bundler + Bun.serve() for SSR
        </p>
      </div>
      <div className="card">
        <h3>Stack:</h3>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>Bun's native bundler (replaces Vite/esbuild)</li>
          <li>Bun.serve() HTTP server</li>
          <li>TanStack Router for routing</li>
          <li>React 19 for rendering</li>
        </ul>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <div className="card">
        <p>This is a novel setup demonstrating TanStack Router with:</p>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>Server-side rendering via renderToString</li>
          <li>Client-side hydration</li>
          <li>Code-based routing (no file-based magic)</li>
          <li>Hot reload in development</li>
        </ul>
      </div>
    </div>
  );
}

// Posts with loader (data fetching example)
const postsData = [
  { id: 1, title: "Getting Started with Bun", author: "bunny" },
  { id: 2, title: "TanStack Router Deep Dive", author: "tanner" },
  { id: 3, title: "SSR Without the Complexity", author: "claude" },
];

function PostsPage() {
  const posts = postsRoute.useLoaderData();
  return (
    <div>
      <h1>Posts</h1>
      {posts.map((post) => (
        <div key={post.id} className="card">
          <h3>{post.title}</h3>
          <p style={{ color: "#a1a1aa" }}>by {post.author}</p>
        </div>
      ))}
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

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts",
  component: PostsPage,
  loader: async () => {
    // Simulate async data fetch
    await new Promise((r) => setTimeout(r, 100));
    return postsData;
  },
});

// Build route tree
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, postsRoute]);

// Factory to create router instances
export function createAppRouter(url?: string) {
  const history = url
    ? createMemoryHistory({ initialEntries: [url] })
    : undefined;

  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
  });
}

// Type registration for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
