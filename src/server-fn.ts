// Enhanced Server Functions - TanStack Start-like API for Pure Bun
// Provides: createServerFn, middleware, validators, context, redirects, errors

import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export interface ServerFnContext {
  request: Request;
  headers: Headers;
  responseHeaders: Headers;
  responseStatus: number;
}

// AsyncLocalStorage for request context
const contextStorage = new Map<symbol, ServerFnContext>();
let currentContextKey: symbol | null = null;

export function getRequestContext(): ServerFnContext {
  if (!currentContextKey) {
    throw new Error("getRequestContext() must be called within a server function");
  }
  const ctx = contextStorage.get(currentContextKey);
  if (!ctx) {
    throw new Error("No request context available");
  }
  return ctx;
}

// ============================================================================
// Server Context Utilities (like TanStack Start)
// ============================================================================

export function getRequest(): Request {
  return getRequestContext().request;
}

export function getRequestHeader(name: string): string | null {
  return getRequestContext().headers.get(name);
}

export function getRequestHeaders(): Headers {
  return getRequestContext().headers;
}

export function setResponseHeader(name: string, value: string): void {
  getRequestContext().responseHeaders.set(name, value);
}

export function setResponseStatus(status: number): void {
  getRequestContext().responseStatus = status;
}

export function getCookie(name: string): string | undefined {
  const cookies = getRequestHeader("cookie");
  if (!cookies) return undefined;
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setCookie(name: string, value: string, options?: {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}): void {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options?.path) cookie += `; Path=${options.path}`;
  if (options?.domain) cookie += `; Domain=${options.domain}`;
  if (options?.secure) cookie += "; Secure";
  if (options?.httpOnly) cookie += "; HttpOnly";
  if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;

  const ctx = getRequestContext();
  const existing = ctx.responseHeaders.get("Set-Cookie");
  if (existing) {
    ctx.responseHeaders.set("Set-Cookie", `${existing}, ${cookie}`);
  } else {
    ctx.responseHeaders.set("Set-Cookie", cookie);
  }
}

// ============================================================================
// Redirect & Error Utilities
// ============================================================================

export class RedirectError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: 301 | 302 | 303 | 307 | 308 = 302
  ) {
    super(`Redirect to ${url}`);
    this.name = "RedirectError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): never {
  throw new RedirectError(url, status);
}

export function notFound(message?: string): never {
  throw new NotFoundError(message);
}

// ============================================================================
// Middleware System
// ============================================================================

export interface MiddlewareContext<TData = unknown> {
  request: Request;
  data: TData;
  next: <T>(data?: T) => Promise<T>;
}

export type MiddlewareFn<TInput = unknown, TOutput = unknown> = (
  ctx: MiddlewareContext<TInput>
) => Promise<TOutput>;

export interface Middleware<TInput = unknown, TOutput = unknown> {
  _type: "middleware";
  fn: MiddlewareFn<TInput, TOutput>;
}

export function createMiddleware<TInput = unknown, TOutput = unknown>(
  fn: MiddlewareFn<TInput, TOutput>
): Middleware<TInput, TOutput> {
  return {
    _type: "middleware",
    fn,
  };
}

// Built-in middleware examples
export const logMiddleware = createMiddleware(async ({ request, next }) => {
  const start = performance.now();
  const result = await next();
  const duration = (performance.now() - start).toFixed(2);
  console.log(`[server-fn] ${request.method} ${new URL(request.url).pathname} - ${duration}ms`);
  return result;
});

export const authMiddleware = createMiddleware(async ({ request, next }) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }
  const token = authHeader.slice(7);
  // In a real app, verify the token
  return next({ user: { token } });
});

// ============================================================================
// Server Function Builder (Fluent API like TanStack Start)
// ============================================================================

type ValidatorFn<T> = (input: unknown) => T | Promise<T>;
type ZodSchema<T> = z.ZodType<T>;

interface ServerFnBuilder<TInput, TOutput, TMethod extends "GET" | "POST"> {
  validator<T>(schema: ZodSchema<T> | ValidatorFn<T>): ServerFnBuilder<T, TOutput, TMethod>;
  middleware<TNewOutput>(mw: Middleware<TOutput, TNewOutput>): ServerFnBuilder<TInput, TNewOutput, TMethod>;
  handler(fn: (ctx: { input: TInput; context: ServerFnContext }) => Promise<TOutput>): ServerFn<TInput, TOutput>;
}

export interface ServerFn<TInput, TOutput> {
  (input: TInput): Promise<TOutput>;
  _name: string;
  _method: "GET" | "POST";
  url: string;
}

interface ServerFnConfig<TInput, TOutput> {
  name: string;
  method: "GET" | "POST";
  validator?: ValidatorFn<TInput> | ZodSchema<TInput>;
  middlewares: Middleware[];
  handler?: (ctx: { input: TInput; context: ServerFnContext }) => Promise<TOutput>;
}

// Registry of all server functions
export const serverFnRegistry = new Map<string, ServerFnConfig<unknown, unknown>>();

function createServerFnBuilder<TInput, TOutput, TMethod extends "GET" | "POST">(
  config: ServerFnConfig<TInput, TOutput>
): ServerFnBuilder<TInput, TOutput, TMethod> {
  return {
    validator<T>(schema: ZodSchema<T> | ValidatorFn<T>) {
      const validatorFn: ValidatorFn<T> = typeof schema === "function"
        ? schema
        : (input: unknown) => schema.parse(input);

      return createServerFnBuilder<T, TOutput, TMethod>({
        ...config,
        validator: validatorFn as ValidatorFn<unknown>,
      } as ServerFnConfig<T, TOutput>);
    },

    middleware<TNewOutput>(mw: Middleware<TOutput, TNewOutput>) {
      return createServerFnBuilder<TInput, TNewOutput, TMethod>({
        ...config,
        middlewares: [...config.middlewares, mw],
      } as unknown as ServerFnConfig<TInput, TNewOutput>);
    },

    handler(fn: (ctx: { input: TInput; context: ServerFnContext }) => Promise<TOutput>): ServerFn<TInput, TOutput> {
      const finalConfig: ServerFnConfig<TInput, TOutput> = {
        ...config,
        handler: fn,
      };

      // Register the function
      serverFnRegistry.set(config.name, finalConfig as ServerFnConfig<unknown, unknown>);

      // Create the callable function
      const serverFn = async (input: TInput): Promise<TOutput> => {
        // On server, call directly (with mock context for direct calls)
        if (typeof window === "undefined") {
          const mockRequest = new Request("http://localhost/_server-fn", {
            method: config.method,
            headers: { "Content-Type": "application/json" },
          });
          return executeServerFn(config.name, input, mockRequest) as Promise<TOutput>;
        }

        // On client, make RPC call
        const url = `/_server-fn/${config.name}`;
        const fetchOptions: RequestInit = config.method === "GET"
          ? { method: "GET" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            };

        if (config.method === "GET" && input !== undefined) {
          const params = new URLSearchParams({ input: JSON.stringify(input) });
          const response = await fetch(`${url}?${params}`, fetchOptions);
          return handleResponse(response);
        }

        const response = await fetch(url, fetchOptions);
        return handleResponse(response);
      };

      serverFn._name = config.name;
      serverFn._method = config.method;
      serverFn.url = `/_server-fn/${config.name}`;

      return serverFn;
    },
  };
}

async function handleResponse(response: Response) {
  if (response.redirected) {
    window.location.href = response.url;
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Server error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Deterministic counter for server function names
// This ensures the same function gets the same name on both server and client
let serverFnCounter = 0;

// Main createServerFn function (TanStack Start-like API)
export function createServerFn(): ServerFnBuilder<void, void, "POST">;
export function createServerFn(options: { method: "GET" }): ServerFnBuilder<void, void, "GET">;
export function createServerFn(options: { method: "POST" }): ServerFnBuilder<void, void, "POST">;
export function createServerFn(options?: { method?: "GET" | "POST" }): ServerFnBuilder<void, void, "GET" | "POST"> {
  const method = options?.method ?? "POST";
  const name = `fn_${serverFnCounter++}`;

  return createServerFnBuilder({
    name,
    method,
    middlewares: [],
  });
}

// Named server function (for explicit naming)
export function createNamedServerFn<TInput = void, TOutput = void>(
  name: string,
  handler: (input: TInput) => Promise<TOutput>
): ServerFn<TInput, TOutput> {
  return createServerFn()
    .handler(async ({ input }) => handler(input as TInput)) as unknown as ServerFn<TInput, TOutput>;
}

// ============================================================================
// Server Function Executor
// ============================================================================

export async function executeServerFn(
  name: string,
  input: unknown,
  request: Request
): Promise<unknown> {
  const config = serverFnRegistry.get(name);
  if (!config) {
    throw new NotFoundError(`Unknown server function: ${name}`);
  }

  // Set up context
  const contextKey = Symbol("context");
  currentContextKey = contextKey;
  const context: ServerFnContext = {
    request,
    headers: request.headers,
    responseHeaders: new Headers(),
    responseStatus: 200,
  };
  contextStorage.set(contextKey, context);

  try {
    // Validate input
    let validatedInput = input;
    if (config.validator) {
      validatedInput = await config.validator(input);
    }

    // Execute middleware chain
    let middlewareData: unknown = {};
    for (const mw of config.middlewares) {
      middlewareData = await mw.fn({
        request,
        data: middlewareData,
        next: async (data) => {
          middlewareData = data ?? middlewareData;
          return middlewareData;
        },
      });
    }

    // Execute handler
    if (!config.handler) {
      throw new Error("No handler defined for server function");
    }

    return await config.handler({
      input: validatedInput as never,
      context,
    });
  } finally {
    // Clean up context
    contextStorage.delete(contextKey);
    currentContextKey = null;
  }
}

// ============================================================================
// FormData Support
// ============================================================================

export async function parseFormData(request: Request): Promise<Record<string, unknown>> {
  const formData = await request.formData();
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Handle file uploads
      result[key] = {
        name: value.name,
        size: value.size,
        type: value.type,
        // Convert to base64 for serialization
        data: Buffer.from(await value.arrayBuffer()).toString("base64"),
      };
    } else {
      // Handle regular fields
      if (key in result) {
        // Multiple values for same key - convert to array
        const existing = result[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          result[key] = [existing, value];
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

// ============================================================================
// Request Handler (used by server)
// ============================================================================

export async function handleServerFn(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const contentType = request.headers.get("content-type") ?? "";

  // Support both /_server-fn (legacy) and /_server-fn/{name} (new)
  let name: string;
  let input: unknown;

  if (pathParts.length >= 2 && pathParts[0] === "_server-fn") {
    name = pathParts[1];
    if (request.method === "GET") {
      const inputParam = url.searchParams.get("input");
      input = inputParam ? JSON.parse(inputParam) : undefined;
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // Handle FormData
      input = await parseFormData(request);
    } else {
      const body = await request.text();
      input = body ? JSON.parse(body) : undefined;
    }
  } else {
    // Legacy format: { name, input } in body
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await parseFormData(request);
      name = formData.name as string;
      input = formData.input ?? formData;
    } else {
      const body = await request.json();
      name = body.name;
      input = body.input;
    }
  }

  // Set up context for response headers
  const contextKey = Symbol("context");
  currentContextKey = contextKey;
  const context: ServerFnContext = {
    request,
    headers: request.headers,
    responseHeaders: new Headers({ "Content-Type": "application/json" }),
    responseStatus: 200,
  };
  contextStorage.set(contextKey, context);

  try {
    const result = await executeServerFn(name, input, request);

    return new Response(JSON.stringify(result), {
      status: context.responseStatus,
      headers: context.responseHeaders,
    });
  } catch (error) {
    if (error instanceof RedirectError) {
      return new Response(null, {
        status: error.status,
        headers: { Location: error.url, ...Object.fromEntries(context.responseHeaders) },
      });
    }

    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof HttpError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("[server-fn] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    contextStorage.delete(contextKey);
    currentContextKey = null;
  }
}
