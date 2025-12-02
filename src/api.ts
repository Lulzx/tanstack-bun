// Server Functions & API Routes - TanStack Start-like API
// Demonstrates: createServerFn, validators, middleware, context, API routes

import { z } from "zod";
import {
  createServerFn,
  createMiddleware,
  getRequestHeader,
  setResponseHeader,
  setCookie,
  getCookie,
  redirect,
  notFound,
  logMiddleware,
} from "./server-fn";
import {
  defineApiRoute,
  json,
  apiError,
  parseBody,
} from "./api-routes";

// ============================================================================
// Server Functions (TanStack Start-like)
// ============================================================================

// Simple server function - get server time
export const getServerTime = createServerFn({ method: "GET" })
  .handler(async () => {
    return {
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  });

// Server function with validation
const EchoInputSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const echo = createServerFn()
  .validator(EchoInputSchema)
  .handler(async ({ input }) => {
    // Access request headers
    const userAgent = getRequestHeader("user-agent") ?? "unknown";

    // Set response header
    setResponseHeader("X-Echo-Version", "1.0");

    // Simulate server processing
    await new Promise((r) => setTimeout(r, 100));

    return {
      original: input.message,
      reversed: input.message.split("").reverse().join(""),
      length: input.message.length,
      processedAt: new Date().toISOString(),
      userAgent,
    };
  });

// Server function with middleware
const timingMiddleware = createMiddleware(async ({ next }) => {
  const start = performance.now();
  const result = await next();
  const duration = performance.now() - start;
  console.log(`[timing] Server function took ${duration.toFixed(2)}ms`);
  return result;
});

export const slowOperation = createServerFn()
  .middleware(logMiddleware)
  .middleware(timingMiddleware)
  .handler(async () => {
    // Simulate slow operation
    await new Promise((r) => setTimeout(r, 500));
    return { status: "completed", duration: "500ms" };
  });

// Server function that uses cookies
export const setUserPreference = createServerFn()
  .validator(z.object({
    theme: z.enum(["light", "dark"]),
  }))
  .handler(async ({ input }) => {
    setCookie("theme", input.theme, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    return { success: true, theme: input.theme };
  });

export const getUserPreference = createServerFn({ method: "GET" })
  .handler(async () => {
    const theme = getCookie("theme") ?? "light";
    return { theme };
  });

// Server function with redirect
export const loginAndRedirect = createServerFn()
  .validator(z.object({
    username: z.string().min(1),
    returnTo: z.string().optional(),
  }))
  .handler(async ({ input }) => {
    // Simulate login
    if (input.username === "admin") {
      setCookie("session", "logged-in", { httpOnly: true, path: "/" });
      redirect(input.returnTo ?? "/");
    }
    return { error: "Invalid credentials" };
  });

// Server function with notFound
export const getPostById = createServerFn()
  .validator(z.object({ id: z.number() }))
  .handler(async ({ input }) => {
    const post = postsDb.find((p) => p.id === input.id);
    if (!post) {
      notFound(`Post ${input.id} not found`);
    }
    return post;
  });

// ============================================================================
// In-memory Database
// ============================================================================

interface Post {
  id: number;
  title: string;
  author: string;
  views: number;
  createdAt: string;
}

const postsDb: Post[] = [
  { id: 1, title: "Getting Started with Bun", author: "bunny", views: 1234, createdAt: "2024-01-15" },
  { id: 2, title: "TanStack Router Deep Dive", author: "tanner", views: 892, createdAt: "2024-02-20" },
  { id: 3, title: "SSR Without the Complexity", author: "claude", views: 567, createdAt: "2024-03-10" },
];

let nextPostId = 4;

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

const usersDb: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" },
];

// Legacy server functions for backward compatibility
export const getPosts = createServerFn({ method: "GET" })
  .handler(async () => {
    await new Promise((r) => setTimeout(r, 50));
    return postsDb;
  });

export const getPost = createServerFn()
  .validator(z.object({ id: z.number() }))
  .handler(async ({ input }) => {
    await new Promise((r) => setTimeout(r, 30));
    const post = postsDb.find((p) => p.id === input.id);
    if (!post) notFound(`Post ${input.id} not found`);
    return post;
  });

// ============================================================================
// API Routes (REST Endpoints)
// ============================================================================

// Posts CRUD
defineApiRoute("/api/posts", {
  GET: async ({ searchParams }) => {
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const posts = postsDb.slice(offset, offset + limit);
    return json({
      data: posts,
      total: postsDb.length,
      limit,
      offset,
    });
  },
  POST: async ({ request }) => {
    const body = await parseBody<{ title: string; author: string }>(request);

    if (!body.title || !body.author) {
      return apiError(400, "title and author are required");
    }

    const newPost: Post = {
      id: nextPostId++,
      title: body.title,
      author: body.author,
      views: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    postsDb.push(newPost);
    return json(newPost, { status: 201 });
  },
});

defineApiRoute("/api/posts/:id", {
  GET: async ({ params }) => {
    const id = parseInt(params.id);
    const post = postsDb.find((p) => p.id === id);
    if (!post) {
      return apiError(404, `Post ${id} not found`);
    }
    return json(post);
  },
  PUT: async ({ params, request }) => {
    const id = parseInt(params.id);
    const idx = postsDb.findIndex((p) => p.id === id);
    if (idx === -1) return apiError(404, `Post ${id} not found`);

    const body = await parseBody<Partial<Post>>(request);
    postsDb[idx] = { ...postsDb[idx], ...body, id };
    return json(postsDb[idx]);
  },
  DELETE: async ({ params }) => {
    const id = parseInt(params.id);
    const idx = postsDb.findIndex((p) => p.id === id);
    if (idx === -1) return apiError(404, `Post ${id} not found`);

    postsDb.splice(idx, 1);
    return new Response(null, { status: 204 });
  },
});

// Full CRUD for users
defineApiRoute("/api/users", {
  GET: async ({ searchParams }) => {
    const role = searchParams.get("role");
    let users = usersDb;
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    return json({ data: users, total: users.length });
  },
  POST: async ({ request }) => {
    const body = await parseBody<{ name: string; email: string; role?: "admin" | "user" }>(request);
    const newUser: User = {
      id: Math.max(...usersDb.map((u) => u.id)) + 1,
      name: body.name,
      email: body.email,
      role: body.role ?? "user",
    };
    usersDb.push(newUser);
    return json(newUser, { status: 201 });
  },
});

defineApiRoute("/api/users/:id", {
  GET: async ({ params }) => {
    const user = usersDb.find((u) => u.id === parseInt(params.id));
    if (!user) return apiError(404, "User not found");
    return json(user);
  },
  PUT: async ({ params, request }) => {
    const id = parseInt(params.id);
    const idx = usersDb.findIndex((u) => u.id === id);
    if (idx === -1) return apiError(404, "User not found");

    const body = await parseBody<Partial<User>>(request);
    usersDb[idx] = { ...usersDb[idx], ...body, id };
    return json(usersDb[idx]);
  },
  DELETE: async ({ params }) => {
    const id = parseInt(params.id);
    const idx = usersDb.findIndex((u) => u.id === id);
    if (idx === -1) return apiError(404, "User not found");

    usersDb.splice(idx, 1);
    return new Response(null, { status: 204 });
  },
});

// Health check endpoint
defineApiRoute("/api/health", {
  GET: async () => {
    return json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  },
});

// Echo endpoint for testing
defineApiRoute("/api/echo", {
  GET: async ({ searchParams }) => {
    return json({
      method: "GET",
      params: Object.fromEntries(searchParams),
    });
  },
  POST: async ({ request }) => {
    const contentType = request.headers.get("content-type");
    let body: unknown;

    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else if (contentType?.includes("text/")) {
      body = await request.text();
    } else {
      body = await request.text();
    }

    return json({
      method: "POST",
      contentType,
      body,
    });
  },
});
