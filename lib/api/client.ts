/**
 * lib/api/client.ts
 * ─────────────────
 * Core fetch wrapper used by every domain service.
 * Supports:
 *  - Public endpoints  (no token)
 *  - Protected endpoints (Bearer token)
 *  - Next.js 15+ fetch options (revalidate / tags)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Pass accessToken for protected endpoints */
  accessToken?: string;
  /** Next.js fetch cache options, e.g. { revalidate: 60 } or { tags: ["products"] } */
  next?: NextFetchRequestConfig;
  signal?: AbortSignal;
}

// ── Error types ───────────────────────────────────────────────────────────────

/** One entry in the `errors` array returned by the API */
export interface ApiErrorDetail {
  errCode: string;
  field?: string; // field that caused the error (optional)
  message: string; // developer-facing detail
  description?: string; // user-friendly guidance (optional)
}

/** Shape of every non-2xx response body from the API */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors: ApiErrorDetail[];
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: ApiErrorDetail[];

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = response.statusCode;
    this.errors = response.errors ?? [];
  }

  /** First error matching a specific field — useful for single-field validation */
  getFieldError(field: string): ApiErrorDetail | undefined {
    return this.errors.find((e) => e.field === field);
  }

  /**
   * All field errors as Record<fieldName, userMessage>.
   * Prefers `description` (user-friendly) over `message` (dev-facing).
   * Handy for react-hook-form's `setError` calls.
   */
  getFieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.errors
        .filter((e) => Boolean(e.field))
        .map((e) => [e.field!, e.description ?? e.message]),
    );
  }

  /** True when the error list contains a specific errCode */
  hasCode(errCode: string): boolean {
    return this.errors.some((e) => e.errCode === errCode);
  }
}

// ── Core fetch ────────────────────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, accessToken, next, signal } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    next, // Next.js-specific: drives ISR / on-demand revalidation
  });

  if (!response.ok) {
    let errorBody: ApiErrorResponse;

    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      // Body is not JSON (e.g. 502 Bad Gateway from a proxy)
      errorBody = {
        statusCode: response.status,
        message: response.statusText || "An unexpected error occurred",
        errors: [],
      };
    }

    throw new ApiError(errorBody);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Public GET — no auth */
export const publicGet = <T>(
  path: string,
  next?: NextFetchRequestConfig,
): Promise<T> => apiRequest<T>(path, { next });

/** Authenticated GET */
export const privateGet = <T>(
  path: string,
  accessToken: string,
  next?: NextFetchRequestConfig,
): Promise<T> => apiRequest<T>(path, { accessToken, next });

/** Authenticated POST */
export const privatePost = <T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> => apiRequest<T>(path, { method: "POST", body, accessToken });

/** Authenticated PUT */
export const privatePut = <T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> => apiRequest<T>(path, { method: "PUT", body, accessToken });

/** Authenticated PATCH */
export const privatePatch = <T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> => apiRequest<T>(path, { method: "PATCH", body, accessToken });

/** Authenticated DELETE */
export const privateDelete = <T>(
  path: string,
  accessToken: string,
): Promise<T> => apiRequest<T>(path, { method: "DELETE", accessToken });
