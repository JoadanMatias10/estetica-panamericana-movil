import { useCallback, useEffect, useRef, useState } from 'react';

import type { PublicApiLoadOptions } from '../services/public-api-service';

type PublicApiLoader<T> = (options?: PublicApiLoadOptions) => Promise<T>;

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'No fue posible cargar la información. Inténtalo nuevamente.';
}

export function usePublicApiResource<T>(loader: PublicApiLoader<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useRef(false);
  const requestNumber = useRef(0);
  const hasData = useRef(false);

  const load = useCallback(async (forceRefresh: boolean, refreshing: boolean) => {
    const currentRequest = ++requestNumber.current;
    setError(undefined);

    if (refreshing || hasData.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextData = await loader({ forceRefresh });
      if (!mounted.current || currentRequest !== requestNumber.current) return;

      hasData.current = true;
      setData(nextData);
    } catch (caughtError) {
      if (!mounted.current || currentRequest !== requestNumber.current) return;
      setError(errorMessage(caughtError));
    } finally {
      if (!mounted.current || currentRequest !== requestNumber.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loader]);

  useEffect(() => {
    mounted.current = true;
    const initialRequest = setTimeout(() => {
      void load(false, false);
    }, 0);

    return () => {
      clearTimeout(initialRequest);
      mounted.current = false;
      requestNumber.current += 1;
    };
  }, [load]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    onRefresh: () => {
      void load(true, true);
    },
    onRetry: () => {
      void load(true, hasData.current);
    },
  };
}
