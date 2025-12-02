// Selective SSR & Deferred Data Loading - TanStack Start-like Features
// Provides: SSR control, deferred data streaming, Suspense boundary support

// ============================================================================
// SSR Configuration Types
// ============================================================================

export type SSRMode =
  | true           // Full SSR (default)
  | false          // Client-only (no SSR)
  | 'data-only';   // Fetch data on server, render on client

export interface RouteSSRConfig {
  ssr?: SSRMode;
  // Time to wait for deferred data before streaming shell
  deferredTimeout?: number;
}

// Registry for route SSR configurations
const routeSSRConfig = new Map<string, RouteSSRConfig>();

export function setRouteSSRConfig(path: string, config: RouteSSRConfig): void {
  routeSSRConfig.set(path, config);
}

export function getRouteSSRConfig(path: string): RouteSSRConfig {
  // Try exact match first
  if (routeSSRConfig.has(path)) {
    return routeSSRConfig.get(path)!;
  }

  // Try to match dynamic routes (e.g., /posts/:id matches /posts/123)
  for (const [pattern, config] of routeSSRConfig.entries()) {
    if (pattern.includes(':')) {
      const regex = new RegExp(
        '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$'
      );
      if (regex.test(path)) {
        return config;
      }
    }
  }

  // Default: full SSR
  return { ssr: true };
}

export function shouldSSR(path: string): boolean {
  const config = getRouteSSRConfig(path);
  return config.ssr !== false;
}

export function isDataOnlySSR(path: string): boolean {
  const config = getRouteSSRConfig(path);
  return config.ssr === 'data-only';
}

// ============================================================================
// Deferred Data Loading
// ============================================================================

export interface DeferredValue<T> {
  promise: Promise<T>;
  status: 'pending' | 'resolved' | 'rejected';
  value?: T;
  error?: unknown;
}

export interface DeferredData {
  [key: string]: DeferredValue<unknown>;
}

// Create a deferred value that can be streamed
export function defer<T>(promise: Promise<T>): DeferredValue<T> {
  const deferred: DeferredValue<T> = {
    promise,
    status: 'pending',
  };

  promise
    .then((value) => {
      deferred.status = 'resolved';
      deferred.value = value;
    })
    .catch((error) => {
      deferred.status = 'rejected';
      deferred.error = error;
    });

  return deferred;
}

// Await a deferred value with timeout
export async function awaitDeferred<T>(
  deferred: DeferredValue<T>,
  timeoutMs: number = 0
): Promise<T | null> {
  if (deferred.status === 'resolved') {
    return deferred.value as T;
  }

  if (deferred.status === 'rejected') {
    throw deferred.error;
  }

  if (timeoutMs <= 0) {
    return null; // Don't wait, let it stream
  }

  // Race between the promise and timeout
  return Promise.race([
    deferred.promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// ============================================================================
// Streaming SSR Utilities
// ============================================================================

// Generate script to inject deferred data on client
export function createDeferredScript(key: string, data: unknown): string {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script>window.__DEFERRED_DATA__ = window.__DEFERRED_DATA__ || {}; window.__DEFERRED_DATA__["${key}"] = ${serialized};</script>`;
}

// Create streaming transform that injects deferred data
export function createDeferredTransform(
  deferredPromises: Map<string, Promise<unknown>>
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let bodyEnded = false;

  return new TransformStream({
    async transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      // Check if we've reached the end of body
      const bodyEndIndex = buffer.indexOf('</body>');
      if (bodyEndIndex !== -1 && !bodyEnded) {
        bodyEnded = true;

        // Inject any resolved deferred data before </body>
        const beforeBody = buffer.slice(0, bodyEndIndex);
        const afterBody = buffer.slice(bodyEndIndex);

        // Check for resolved promises and inject their data
        const scripts: string[] = [];
        for (const [key, promise] of deferredPromises.entries()) {
          try {
            // Use Promise.race with a tiny timeout to check if resolved
            const result = await Promise.race([
              promise.then(data => ({ resolved: true, data })),
              new Promise<{ resolved: false }>(r => setTimeout(() => r({ resolved: false }), 0)),
            ]);

            if (result.resolved) {
              scripts.push(createDeferredScript(key, (result as { resolved: true; data: unknown }).data));
            }
          } catch {
            // Promise rejected, we could inject error state
          }
        }

        controller.enqueue(encoder.encode(beforeBody + scripts.join('') + afterBody));
        buffer = '';
        return;
      }

      // If not at body end, just pass through
      if (bodyEnded || buffer.length > 10000) {
        controller.enqueue(encoder.encode(buffer));
        buffer = '';
      }
    },

    flush(controller) {
      if (buffer) {
        controller.enqueue(encoder.encode(buffer));
      }
    },
  });
}

// ============================================================================
// Client-Only Shell for ssr: false routes
// ============================================================================

export function createClientOnlyShell(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
    .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="root"><div class="loading"><div class="spinner"></div></div></div>
  <script>window.__INITIAL_URL__ = "${url}";</script>
  <script type="module" src="/client.js"></script>
</body>
</html>`;
}

// ============================================================================
// Data-Only SSR Shell
// ============================================================================

export function createDataOnlyShell(url: string, prefetchedData: Record<string, unknown>): string {
  const serializedData = JSON.stringify(prefetchedData).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
    .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="root"><div class="loading"><div class="spinner"></div></div></div>
  <script>
    window.__INITIAL_URL__ = "${url}";
    window.__PREFETCHED_DATA__ = ${serializedData};
  </script>
  <script type="module" src="/client.js"></script>
</body>
</html>`;
}

// ============================================================================
// Loader with Deferred Support
// ============================================================================

export interface LoaderContext {
  params: Record<string, string>;
  request: Request;
}

export type LoaderResult<T> = T | { deferred: Record<string, Promise<unknown>> };

// Helper to check if result has deferred data
export function hasDeferredData(result: unknown): result is { deferred: Record<string, Promise<unknown>> } {
  return typeof result === 'object' && result !== null && 'deferred' in result;
}
