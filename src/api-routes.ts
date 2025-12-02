// API Routes System - TanStack Start-like REST API handlers for Pure Bun

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface ApiRouteContext {
  request: Request;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

export type ApiRouteHandler = (ctx: ApiRouteContext) => Response | Promise<Response>;

export interface ApiRoute {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handlers: Partial<Record<HttpMethod, ApiRouteHandler>>;
}

// Registry of all API routes
const apiRoutes: ApiRoute[] = [];

// Convert route pattern to regex
// Supports: /users/:id, /posts/:postId/comments/:commentId, /files/*
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  let regexStr = pattern
    // Handle wildcard
    .replace(/\*/g, "(?:.*)")
    // Handle named params
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });

  return {
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

// Define an API route
export function defineApiRoute(
  pattern: string,
  handlers: Partial<Record<HttpMethod, ApiRouteHandler>>
): ApiRoute {
  const { regex, paramNames } = patternToRegex(pattern);
  const route: ApiRoute = {
    pattern,
    regex,
    paramNames,
    handlers,
  };

  // Insert route at appropriate position based on specificity
  // Routes without params should come before routes with params for the same base path
  const hasParams = paramNames.length > 0;
  if (hasParams) {
    apiRoutes.push(route);
  } else {
    // Find the right position - insert before param routes
    let insertIdx = apiRoutes.length;
    for (let i = 0; i < apiRoutes.length; i++) {
      if (apiRoutes[i].paramNames.length > 0 && apiRoutes[i].pattern.startsWith(pattern.replace(/\/+$/, ''))) {
        insertIdx = i;
        break;
      }
    }
    apiRoutes.splice(insertIdx, 0, route);
  }

  return route;
}

// Convenience methods for single-method routes
export const apiGet = (pattern: string, handler: ApiRouteHandler) =>
  defineApiRoute(pattern, { GET: handler });

export const apiPost = (pattern: string, handler: ApiRouteHandler) =>
  defineApiRoute(pattern, { POST: handler });

export const apiPut = (pattern: string, handler: ApiRouteHandler) =>
  defineApiRoute(pattern, { PUT: handler });

export const apiPatch = (pattern: string, handler: ApiRouteHandler) =>
  defineApiRoute(pattern, { PATCH: handler });

export const apiDelete = (pattern: string, handler: ApiRouteHandler) =>
  defineApiRoute(pattern, { DELETE: handler });

// JSON response helper
export function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

// Error response helper
export function apiError(status: number, message: string): Response {
  return json({ error: message }, { status });
}

// Parse JSON body helper
export async function parseBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return request.json();
  }
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    return Object.fromEntries(params) as T;
  }
  if (contentType?.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(formData) as T;
  }
  throw new Error(`Unsupported content type: ${contentType}`);
}

// Handle API request
export async function handleApiRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method as HttpMethod;

  // Only handle /api/* routes
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  // Find matching route
  for (const route of apiRoutes) {
    const match = pathname.match(route.regex);
    if (match) {
      const handler = route.handlers[method];

      // Handle OPTIONS for CORS
      if (method === "OPTIONS") {
        const allowedMethods = Object.keys(route.handlers).join(", ");
        return new Response(null, {
          status: 204,
          headers: {
            "Allow": allowedMethods,
            "Access-Control-Allow-Methods": allowedMethods,
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }

      if (!handler) {
        const allowedMethods = Object.keys(route.handlers).join(", ");
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Allow": allowedMethods,
          },
        });
      }

      // Extract params
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      // Execute handler
      try {
        return await handler({
          request,
          params,
          searchParams: url.searchParams,
        });
      } catch (error) {
        console.error("[api-route] Error:", error);
        return json(
          { error: error instanceof Error ? error.message : "Internal Server Error" },
          { status: 500 }
        );
      }
    }
  }

  // No matching route
  return null;
}

// Get all registered routes (useful for debugging)
export function getApiRoutes(): Array<{ pattern: string; methods: string[] }> {
  return apiRoutes.map((route) => ({
    pattern: route.pattern,
    methods: Object.keys(route.handlers),
  }));
}
