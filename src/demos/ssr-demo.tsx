import { useState, useEffect, Suspense } from "react";
import { Link, Outlet } from "@tanstack/react-router";

// Types for prefetched data
declare global {
  interface Window {
    __PREFETCHED_DATA__?: Record<string, unknown>;
    __DEFERRED_DATA__?: Record<string, unknown>;
  }
}

// Main SSR Demo page with links to sub-pages
export function SSRDemo() {
  return (
    <div>
      <h1>SSR Features</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Selective SSR and deferred data loading
      </p>

      <div className="card">
        <h3>SSR Modes</h3>
        <p style={{ margin: "0.5rem 0" }}>
          TanStack Start-like SSR control at the route level.
        </p>
        <ul style={{ marginTop: "1rem" }}>
          <li>
            <strong>Full SSR (default)</strong> - Server renders complete HTML
          </li>
          <li>
            <strong>Client-only</strong> - Server sends shell, client renders content
          </li>
          <li>
            <strong>Data-only</strong> - Server fetches data, client renders with prefetched data
          </li>
        </ul>
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <Link to="/ssr-demo/full-ssr" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Full SSR</h3>
            <p className="muted">Default mode - complete server render</p>
            <code style={{ fontSize: "0.8rem" }}>ssr: true</code>
          </div>
        </Link>

        <Link to="/ssr-demo/client-only" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Client Only</h3>
            <p className="muted">Shell from server, render on client</p>
            <code style={{ fontSize: "0.8rem" }}>ssr: false</code>
          </div>
        </Link>

        <Link to="/ssr-demo/data-only" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Data Only</h3>
            <p className="muted">Server fetches data, client renders</p>
            <code style={{ fontSize: "0.8rem" }}>ssr: 'data-only'</code>
          </div>
        </Link>

        <Link to="/ssr-demo/streaming" style={{ textDecoration: "none" }}>
          <div className="card">
            <h3>Streaming</h3>
            <p className="muted">Deferred data with Suspense</p>
            <code style={{ fontSize: "0.8rem" }}>defer()</code>
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>How It Works</h3>
        <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
          Configure SSR mode per route in <code>server.tsx</code>:
        </p>
        <pre
          style={{
            background: "#262626",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
{`setRouteSSRConfig("/path", { ssr: false });
setRouteSSRConfig("/path", { ssr: 'data-only' });
setRouteSSRConfig("/path", { ssr: true }); // default`}
        </pre>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Features: Selective SSR, client-only rendering, data prefetching, streaming
      </p>
    </div>
  );
}

// Full SSR sub-page (default behavior)
export function FullSSRPage() {
  const [hydrated, setHydrated] = useState(false);
  const renderTime = new Date().toISOString();

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div>
      <h2>Full SSR Mode</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        <Link to="/ssr-demo">&larr; Back to SSR Demo</Link>
      </p>

      <div className="card">
        <h3>Server Rendered Content</h3>
        <p>This content was rendered on the server.</p>
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#262626",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>Rendered at:</strong> {renderTime}
          </div>
          <div>
            <strong>Hydrated:</strong>{" "}
            <span
              style={{
                color: hydrated ? "#22c55e" : "#eab308",
              }}
            >
              {hydrated ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>How to verify SSR</h3>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>View page source (Ctrl+U / Cmd+U)</li>
          <li>Look for the rendered content in HTML</li>
          <li>The timestamp should be visible in source</li>
        </ol>
      </div>
    </div>
  );
}

// Client-only sub-page
export function ClientOnlyPage() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2>Client Only Mode</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        <Link to="/ssr-demo">&larr; Back to SSR Demo</Link>
      </p>

      <div
        className="card"
        style={{ background: "#1e3a5f", borderColor: "#3b82f6" }}
      >
        <h3>Client Rendered</h3>
        <p>
          This page has <code>ssr: false</code> - the server only sends an empty
          shell.
        </p>
      </div>

      <div className="card">
        <h3>Interactive Counter</h3>
        <p className="muted" style={{ margin: "0.5rem 0" }}>
          Works immediately since no hydration mismatch possible
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <button
            onClick={() => setCount((c) => c - 1)}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            -
          </button>
          <span style={{ fontSize: "2rem", fontWeight: "bold", width: "80px", textAlign: "center" }}>
            {count}
          </span>
          <button
            onClick={() => setCount((c) => c + 1)}
            style={{
              padding: "0.5rem 1rem",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="card">
        <h3>How to verify client-only</h3>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>View page source (Ctrl+U / Cmd+U)</li>
          <li>You'll only see a loading spinner in the HTML</li>
          <li>Content is rendered entirely by JavaScript</li>
        </ol>
      </div>

      <div className="card">
        <h3>Use Cases</h3>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Admin dashboards</li>
          <li>User-specific content</li>
          <li>Heavy interactive components</li>
          <li>Content behind authentication</li>
        </ul>
      </div>
    </div>
  );
}

// Data-only SSR sub-page
export function DataOnlyPage() {
  const [mounted, setMounted] = useState(false);
  const [prefetchedData, setPrefetchedData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setMounted(true);
    // Read prefetched data from window
    if (typeof window !== "undefined" && window.__PREFETCHED_DATA__) {
      setPrefetchedData(window.__PREFETCHED_DATA__);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2>Data Only Mode</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        <Link to="/ssr-demo">&larr; Back to SSR Demo</Link>
      </p>

      <div
        className="card"
        style={{ background: "#3d1f5c", borderColor: "#8b5cf6" }}
      >
        <h3>Data Prefetched on Server</h3>
        <p>
          This page has <code>ssr: 'data-only'</code> - server fetches data but
          doesn't render.
        </p>
      </div>

      <div className="card">
        <h3>Prefetched Data</h3>
        <p className="muted" style={{ margin: "0.5rem 0" }}>
          This data was fetched on the server and injected into the page:
        </p>
        <pre
          style={{
            background: "#262626",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
          {prefetchedData
            ? JSON.stringify(prefetchedData, null, 2)
            : "No prefetched data available"}
        </pre>
      </div>

      <div className="card">
        <h3>Benefits</h3>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Faster TTFB (no render blocking)</li>
          <li>Data is ready when JS loads</li>
          <li>Good for data-heavy pages</li>
          <li>Avoids hydration mismatches</li>
        </ul>
      </div>

      <div className="card">
        <h3>How to verify data-only</h3>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>View page source</li>
          <li>
            Look for <code>window.__PREFETCHED_DATA__</code>
          </li>
          <li>Data is in JSON, not rendered HTML</li>
        </ol>
      </div>
    </div>
  );
}

// Streaming/Deferred data sub-page
export function StreamingPage() {
  const [mounted, setMounted] = useState(false);
  const [fastData, setFastData] = useState<string | null>(null);
  const [slowData, setSlowData] = useState<string | null>(null);
  const [loadingFast, setLoadingFast] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFastData = async () => {
    setLoadingFast(true);
    await new Promise((r) => setTimeout(r, 100));
    setFastData(`Fast data loaded at ${new Date().toLocaleTimeString()}`);
    setLoadingFast(false);
  };

  const fetchSlowData = async () => {
    setLoadingSlow(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSlowData(`Slow data loaded at ${new Date().toLocaleTimeString()}`);
    setLoadingSlow(false);
  };

  return (
    <div>
      <h2>Streaming & Deferred Data</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        <Link to="/ssr-demo">&larr; Back to SSR Demo</Link>
      </p>

      <div
        className="card"
        style={{ background: "#1f3d2e", borderColor: "#22c55e" }}
      >
        <h3>Progressive Loading</h3>
        <p>
          Stream initial content fast, defer slow data to load progressively.
        </p>
      </div>

      <div className="card">
        <h3>Simulated Data Loading</h3>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={fetchFastData}
            disabled={loadingFast}
            style={{
              padding: "0.5rem 1rem",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loadingFast ? "wait" : "pointer",
            }}
          >
            {loadingFast ? "Loading..." : "Fetch Fast Data (100ms)"}
          </button>
          <button
            onClick={fetchSlowData}
            disabled={loadingSlow}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loadingSlow ? "wait" : "pointer",
            }}
          >
            {loadingSlow ? "Loading..." : "Fetch Slow Data (2s)"}
          </button>
        </div>

        {(fastData || slowData) && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#262626",
              borderRadius: "6px",
            }}
          >
            {fastData && (
              <div style={{ color: "#22c55e" }}>Fast: {fastData}</div>
            )}
            {slowData && (
              <div style={{ color: "#f59e0b" }}>Slow: {slowData}</div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Deferred Data Pattern</h3>
        <pre
          style={{
            background: "#262626",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
{`// In your loader
export const loader = async () => {
  const fastData = await fetchFastData();

  return {
    fastData,
    // Defer slow data - streams after initial render
    deferred: {
      slowData: fetchSlowData(),
    },
  };
};

// In your component
<Suspense fallback={<Spinner />}>
  <Await resolve={loaderData.deferred.slowData}>
    {(data) => <SlowComponent data={data} />}
  </Await>
</Suspense>`}
        </pre>
      </div>

      <div className="card">
        <h3>Benefits of Streaming</h3>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Immediate visual feedback</li>
          <li>Non-blocking slow data</li>
          <li>Better perceived performance</li>
          <li>Progressive enhancement</li>
        </ul>
      </div>
    </div>
  );
}
