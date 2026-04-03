/**
 * lib/api/client.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NextOptions {
  revalidate?: number | false;
  tags?: string[];
}

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string;
  next?: NextOptions;
  signal?: AbortSignal;
}

// ── Error types ───────────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  errCode: string;
  field?: string;
  message: string;
  description?: string;
}

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

  getFieldError(field: string): ApiErrorDetail | undefined {
    return this.errors.find((e) => e.field === field);
  }

  getFieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.errors
        .filter((e) => Boolean(e.field))
        .map((e) => [e.field!, e.description ?? e.message]),
    );
  }

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
    next,
  });

  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
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
export const publicGet = <T>(path: string, next?: NextOptions): Promise<T> =>
  apiRequest<T>(path, { next });

/** Authenticated GET — Server Components / Route Handlers */
export const privateGet = <T>(
  path: string,
  accessToken: string,
  next?: NextOptions,
): Promise<T> => apiRequest<T>(path, { accessToken, next });

/** Authenticated fetch — flexible method, used by client-side auth flows */
export const authFetch = <T>(
  path: string,
  accessToken: string,
  options?: Omit<RequestOptions, "accessToken">,
): Promise<T> => apiRequest<T>(path, { ...options, accessToken });

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
