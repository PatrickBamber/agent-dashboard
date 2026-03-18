import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic fetch hook with loading/error/data state.
 * fn: () => Promise<data>
 * deps: dependency array passed to useEffect (auto-refetches on change)
 * autoRefresh: ms interval for polling (default: none)
 */
export function useApi(fn, deps = [], autoRefresh = null) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const data = await fn();
      if (mountedRef.current) setState({ loading: false, error: null, data });
    } catch (err) {
      if (mountedRef.current) setState(s => ({ ...s, loading: false, error: err.message }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetch, autoRefresh);
    return () => clearInterval(id);
  }, [fetch, autoRefresh]);

  return state;
}
