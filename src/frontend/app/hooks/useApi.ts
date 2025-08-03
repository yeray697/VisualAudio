/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useConfig } from '../providers/ConfigProvider';
import { useEffect, useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ResponseType = 'json' | 'blob' | 'text';

interface UseApiOptions<T> {
  endpoint: string;
  method?: HttpMethod;
  body?: any;
  params?: Record<string, string | number>;
  mapFn?: (data: any) => T;
  autoFetch?: boolean;
  responseType?: ResponseType;
}

export function useApi<T = any>({
  endpoint,
  method = 'GET',
  body,
  params,
  mapFn,
  autoFetch = true,
  responseType = 'json',
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

      const type = overrides?.responseType || responseType;
      let result: any;
      if (type === 'blob') result = await res.blob();
      else if (type === 'text') result = await res.text();
      else result = await res.json().catch(() => null);

      const mapped = mapFn ? mapFn(result) : result;
      setData(mapped);
      return mapped;
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
  }, [autoFetch, endpoint, JSON.stringify(params), JSON.stringify(body)]);

  return { data, loading, error, fetch: fetchData };
}
