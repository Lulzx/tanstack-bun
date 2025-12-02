import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./routes";

// Create router for client (uses browser history by default)
const router = createAppRouter();

// Hydrate the server-rendered HTML
hydrateRoot(document, <RouterProvider router={router} />);

if (import.meta.env?.DEV) {
  console.log("[client] Hydrated successfully");
}
