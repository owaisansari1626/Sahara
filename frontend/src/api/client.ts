/**
 * Sahara v2 — Base API Client
 * Configured via import.meta.env.VITE_API_BASE_URL (defaults to https://sahara-h63t.onrender.com)
 */

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'https://sahara-h63t.onrender.com';

export interface RequestOptions extends RequestInit {
  adminKey?: string;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.adminKey) {
    headers['X-Admin-Key'] = options.adminKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && (errorJson.detail || errorJson.message)) {
        errorDetail = errorJson.detail || errorJson.message;
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export { API_BASE_URL };
