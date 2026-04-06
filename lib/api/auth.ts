/**
 * lib/api/auth.ts
 */

import { publicGet, authFetch } from "./client";

export type AuthProviderName = "clerk" | "auth0";

export interface AuthProviderResponse {
  active: AuthProviderName;
  available: AuthProviderName[];
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/** GET /auth/provider — public */
export async function getAuthProvider(): Promise<AuthProviderResponse> {
  return publicGet<AuthProviderResponse>("/auth/provider", {
    revalidate: 0,
    tags: ["auth-provider"],
  });
}

/** GET /auth/me — requires accessToken */
export async function getAuthMe(accessToken: string): Promise<AuthUser> {
  return authFetch<AuthUser>("/auth/me", accessToken);
}
