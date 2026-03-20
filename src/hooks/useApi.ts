import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  autoRefresh: number | null = null
): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({ loading: true, error: null, data: null });
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await fn();
      if (mountedRef.current) setState({ loading: false, error: null, data });
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setState(s => ({ ...s, loading: false, error: msg }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, autoRefresh);
    return () => clearInterval(id);
  }, [fetchData, autoRefresh]);

  return state;
}
