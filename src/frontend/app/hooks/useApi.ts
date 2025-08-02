/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useConfig } from '../providers/ConfigProvider';
import { useEffect, useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface UseApiOptions<T> {
  endpoint: string;
  method?: HttpMethod;
  body?: any;
  params?: Record<string, string | number>;
  mapFn?: (data: any) => T;
  autoFetch?: boolean;
}

export function useApi<T = any>({
  endpoint,
  method = 'GET',
  body,
  params,
  mapFn,
  autoFetch = true,
}: UseApiOptions<T>) {
  const config = useConfig();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const buildUrl = (overrideParams?: Record<string, string | number>, overrideEndpoint?: string) => {
    const url = new URL(`${config.apiUrl}${overrideEndpoint || endpoint}`);
    const p = overrideParams || params;
    if (p) {
      Object.entries(p).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }
    return url.toString();
  };

  const fetchData = async (overrides?: Partial<UseApiOptions<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const bodyFormatted = overrides?.body !== undefined
          ? (overrides.body instanceof FormData ? overrides.body : JSON.stringify(overrides.body))
          : body
            ? JSON.stringify(body)
            : undefined;
      const isFormData = bodyFormatted instanceof FormData;
      const res = await fetch(buildUrl(overrides?.params, overrides?.endpoint), {
        method: overrides?.method || method,
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: bodyFormatted,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => null);
      setData(mapFn ? mapFn(json) : json);
      return mapFn ? mapFn(json) : json;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params), JSON.stringify(body)]);

  return { data, loading, error, fetch: fetchData };
}
