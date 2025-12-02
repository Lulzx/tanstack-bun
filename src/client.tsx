import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./routes";

// Create router for client (uses browser history by default)
const router = createAppRouter();

// Hydrate the SSR'd HTML
hydrateRoot(document, <RouterProvider router={router} />);

console.log("🔥 Client hydrated!");
