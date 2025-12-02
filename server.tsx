import { renderToString } from "react-dom/server";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./src/routes";

const isDev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;

// Cache for bundled client JS
let clientBundle: string | null = null;

async function buildClient(): Promise<string> {
  if (clientBundle && !isDev) return clientBundle;

  console.log("📦 Bundling client...");

  const result = await Bun.build({
    entrypoints: ["./src/client.tsx"],
    outdir: "./dist",
    target: "browser",
    format: "esm",
    minify: !isDev,
    sourcemap: isDev ? "inline" : "none",
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        isDev ? "development" : "production"
      ),
    },
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    throw new Error("Client build failed");
  }

  // Read the bundled output
  const output = result.outputs[0];
  clientBundle = await output.text();

  console.log(`✅ Client bundled (${(clientBundle.length / 1024).toFixed(1)}kb)`);
  return clientBundle;
}

// Pre-build on startup
await buildClient();

// SSR render function
async function renderApp(url: string): Promise<string> {
  const router = createAppRouter(url);

  // Wait for router to be ready (loads data)
  await router.load();

  // Render to string
  const html = renderToString(<RouterProvider router={router} />);

  return html;
}

// Bun native HTTP server
const server = Bun.serve({
  port: PORT,

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve bundled client JS
    if (pathname === "/client.js") {
      const js = await buildClient();
      return new Response(js, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000",
        },
      });
    }

    // SSR for all other routes
    try {
      const html = await renderApp(pathname);

      return new Response(`<!DOCTYPE html>${html}`, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("SSR Error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`
🚀 TanStack + Bun Server
   ${isDev ? "Development" : "Production"} mode
   http://localhost:${PORT}
   
   No Vite. No Nitro. Pure Bun.
`);
