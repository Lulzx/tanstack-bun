import { renderToReadableStream } from "react-dom/server";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./src/routes";
import { handleServerFn } from "./src/server-fn";
import { handleApiRoute } from "./src/api-routes";
import {
  shouldSSR,
  isDataOnlySSR,
  createClientOnlyShell,
  createDataOnlyShell,
  setRouteSSRConfig,
} from "./src/ssr";

// Import server functions and API routes to register them
import "./src/api";

// Configure SSR modes for specific routes
// ssr: false = Client-only rendering
// ssr: 'data-only' = Fetch data on server, render on client
// ssr: true (default) = Full SSR
setRouteSSRConfig("/ssr-demo/client-only", { ssr: false });
setRouteSSRConfig("/ssr-demo/data-only", { ssr: "data-only" });
setRouteSSRConfig("/ssr-demo/streaming", { ssr: true, deferredTimeout: 100 });

const isDev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;

// Client bundle cache
let clientBundle: string | null = null;
let clientBundleHash: string | null = null;

async function buildClient(): Promise<{ code: string; hash: string }> {
  if (clientBundle && clientBundleHash && !isDev) {
    return { code: clientBundle, hash: clientBundleHash };
  }

  const startTime = performance.now();

  const result = await Bun.build({
    entrypoints: ["./src/client.tsx"],
    target: "browser",
    format: "esm",
    minify: !isDev,
    sourcemap: isDev ? "inline" : "none",
    define: {
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
      "import.meta.env.DEV": JSON.stringify(isDev),
    },
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    throw new Error("Client build failed");
  }

  const output = result.outputs[0];
  clientBundle = await output.text();

  // Generate content hash for cache busting
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(clientBundle);
  clientBundleHash = hasher.digest("hex").slice(0, 8);

  const elapsed = (performance.now() - startTime).toFixed(0);
  console.log(`[build] Client bundled (${(clientBundle.length / 1024).toFixed(1)}kb) in ${elapsed}ms`);

  return { code: clientBundle, hash: clientBundleHash };
}

// Pre-build on startup
await buildClient();

// SSR render function with streaming
async function renderApp(url: string): Promise<ReadableStream> {
  const router = createAppRouter({ url, isServer: true });

  // Wait for data loaders
  await router.load();

  // Render to stream
  const stream = await renderToReadableStream(
    <RouterProvider router={router} />,
    {
      bootstrapScriptContent: isDev
        ? `console.log("[ssr] Page rendered at ${new Date().toISOString()}")`
        : undefined,
    }
  );

  return stream;
}


// Bun HTTP server
const server = Bun.serve({
  port: PORT,

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve client bundle
    if (pathname === "/client.js") {
      const { code, hash } = await buildClient();
      return new Response(code, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
          "ETag": `"${hash}"`,
        },
      });
    }

    // Health check
    if (pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Server functions RPC endpoint
    if (pathname.startsWith("/_server-fn")) {
      return handleServerFn(request);
    }

    // API routes (REST endpoints)
    if (pathname.startsWith("/api/")) {
      const apiResponse = await handleApiRoute(request);
      if (apiResponse) {
        return apiResponse;
      }
      // No matching API route
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Selective SSR handling
    const fullUrl = pathname + url.search;

    // Check SSR mode for this route
    if (!shouldSSR(pathname)) {
      // Client-only rendering - return shell and let client render
      console.log(`[ssr] Client-only mode for ${pathname}`);
      return new Response(createClientOnlyShell(fullUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (isDataOnlySSR(pathname)) {
      // Data-only SSR - fetch data on server, render on client
      console.log(`[ssr] Data-only mode for ${pathname}`);
      const router = createAppRouter({ url: fullUrl, isServer: true });
      await router.load();

      // Extract any loader data from the router state
      const prefetchedData: Record<string, unknown> = {};
      // In a real implementation, you'd extract loader data here
      // For demo purposes, we include the current timestamp
      prefetchedData.serverTimestamp = new Date().toISOString();
      prefetchedData.routePath = pathname;

      return new Response(createDataOnlyShell(fullUrl, prefetchedData), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Full SSR (default)
    try {
      const stream = await renderApp(fullUrl);

      return new Response(stream, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.error("[ssr] Error:", error);
      return new Response(
        `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>500 - Server Error</h1><pre>${isDev ? String(error) : "Internal Server Error"}</pre></body></html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  },
});

console.log(`
  TanStack Router + Pure Bun
  ${isDev ? "Development" : "Production"} mode
  http://localhost:${PORT}

  No Vite. No Nitro. Just Bun.
`);
