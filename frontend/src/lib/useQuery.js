import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

/**
 * Minimal stale-while-revalidate fetch hook.
 *
 * Screens previously fetched in a bare useEffect with no cache, so every
 * navigation — including going back to a page visited seconds earlier — showed
 * a skeleton and waited on the network again.
 *
 * Here, a cached response paints immediately and is refreshed in the
 * background, so revisiting a screen is instant and still current. Roughly
 * what react-query does, in 60 lines and no dependency.
 */

const cache = new Map();
const inflight = new Map();

/** Drop cached entries whose key contains `fragment`. Call after a mutation. */
export function invalidate(fragment) {
  for (const key of cache.keys()) {
    if (!fragment || key.includes(fragment)) cache.delete(key);
  }
}

export function useQuery(url, { params, enabled = true, staleMs = 30_000 } = {}) {
  const key = url ? `${url}?${new URLSearchParams(params ?? {}).toString()}` : null;

  const cached = key ? cache.get(key) : null;
  const [data, setData] = useState(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async ({ force = false } = {}) => {
      if (!key || !enabled) return;

      const hit = cache.get(key);
      if (hit) {
        setData(hit.data);
        setLoading(false);
        // Fresh enough — skip the request entirely.
        if (!force && Date.now() - hit.at < staleMs) return;
      }

      // Two components asking for the same thing share one request rather
      // than racing each other.
      let promise = inflight.get(key);
      if (!promise) {
        promise = api
          .get(url, { params })
          .then(({ data: payload }) => {
            cache.set(key, { data: payload, at: Date.now() });
            return payload;
          })
          .finally(() => inflight.delete(key));
        inflight.set(key, promise);
      }

      try {
        const payload = await promise;
        if (mounted.current) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (mounted.current) setError(err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [key, enabled, staleMs]
  );

  useEffect(() => {
    run();
  }, [run]);

  return {
    data,
    loading,
    error,
    refetch: () => run({ force: true }),
    // True only on the very first load, when there is nothing to show yet.
    // A background revalidation must not re-trigger a skeleton.
    isInitialLoading: loading && !data,
  };
}

export default useQuery;
