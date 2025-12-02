// useDeferred - React hook for consuming deferred/streamed data
// Works with SSR streaming to progressively hydrate data

import { useState, useEffect, useSyncExternalStore } from "react";

// Type for deferred data stored on window
declare global {
  interface Window {
    __DEFERRED_DATA__?: Record<string, unknown>;
    __PREFETCHED_DATA__?: Record<string, unknown>;
    __INITIAL_URL__?: string;
  }
}

// Get deferred data from window (injected during SSR streaming)
function getDeferredData<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__DEFERRED_DATA__?.[key] as T | undefined;
}

// Get prefetched data from window (for data-only SSR)
function getPrefetchedData<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__PREFETCHED_DATA__?.[key] as T | undefined;
}

// Subscribe to deferred data changes (data is injected via script tags during streaming)
function subscribeToDeferred(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  // Use MutationObserver to detect new script tags with deferred data
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLScriptElement && node.textContent?.includes("__DEFERRED_DATA__")) {
          callback();
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

// Hook to use deferred data
export function useDeferred<T>(key: string, fallback?: T): {
  data: T | undefined;
  isLoading: boolean;
  isHydrated: boolean;
} {
  const [isHydrated, setIsHydrated] = useState(false);

  // Use syncExternalStore for deferred data
  const data = useSyncExternalStore(
    subscribeToDeferred,
    () => getDeferredData<T>(key) ?? getPrefetchedData<T>(key) ?? fallback,
    () => fallback // Server snapshot
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    data,
    isLoading: !isHydrated && data === undefined,
    isHydrated,
  };
}

// Hook for async data with Suspense support
export function useDeferredPromise<T>(
  key: string,
  fetchFn: () => Promise<T>
): T {
  // Check if data was already streamed
  const cached = getDeferredData<T>(key) ?? getPrefetchedData<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Create or get the promise
  const cacheKey = `__promise_${key}`;
  let promise = (window as Record<string, unknown>)[cacheKey] as Promise<T> | undefined;

  if (!promise) {
    promise = fetchFn().then((data) => {
      // Cache the result for future access
      window.__DEFERRED_DATA__ = window.__DEFERRED_DATA__ || {};
      window.__DEFERRED_DATA__[key] = data;
      return data;
    });
    (window as Record<string, unknown>)[cacheKey] = promise;
  }

  // Throw the promise for Suspense
  throw promise;
}

// Await component - renders children when deferred data is ready
export function Await<T>({
  resolve,
  fallback,
  children,
}: {
  resolve: Promise<T> | T;
  fallback?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}): React.ReactNode {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (resolve instanceof Promise) {
      resolve.then(setData).catch(setError);
    } else {
      setData(resolve);
    }
  }, [resolve]);

  if (error) {
    throw error;
  }

  if (data === null) {
    return fallback ?? null;
  }

  return children(data);
}
