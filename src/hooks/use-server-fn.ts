// useServerFn - React hook for calling server functions (like TanStack Start)
import { useState, useCallback, useTransition } from "react";
import type { ServerFn } from "../server-fn";

export interface UseServerFnResult<TInput, TOutput> {
  data: TOutput | undefined;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (input: TInput) => Promise<TOutput>;
  reset: () => void;
}

export function useServerFn<TInput, TOutput>(
  serverFn: ServerFn<TInput, TOutput>
): UseServerFnResult<TInput, TOutput> {
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            setError(null);
            const result = await serverFn(input);
            setData(result);
            resolve(result);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            reject(error);
          }
        });
      });
    },
    [serverFn]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
  }, []);

  return {
    data,
    error,
    isPending,
    isSuccess: data !== undefined && error === null,
    isError: error !== null,
    mutate,
    reset,
  };
}

// Simplified version that just returns a wrapped function
export function useServerFnSimple<TInput, TOutput>(
  serverFn: ServerFn<TInput, TOutput>
): (input: TInput) => Promise<TOutput> {
  return useCallback((input: TInput) => serverFn(input), [serverFn]);
}
