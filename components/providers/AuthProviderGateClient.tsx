"use client";

import { useEffect } from "react";
import { useAuthProviderStore } from "@/lib/store/auth-provider.store";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
import { AuthTokenSync } from "./AuthTokenSync";
import type { AuthProviderName } from "@/lib/api/auth";

import { ClerkProvider } from "@clerk/nextjs";
import { Auth0Provider } from "@auth0/nextjs-auth0";

const PROVIDER_COOKIE = "x-auth-provider";
const COOKIE_MAX_AGE = 60 * 60 * 24;

interface Props {
  initialActive: AuthProviderName;
  children: React.ReactNode;
}

export function AuthProviderGateClient({ initialActive, children }: Props) {
  useEffect(() => {
    // 1. Seed provider store
    useAuthProviderStore.setState({
      active: initialActive,
      available: [initialActive],
      status: "success",
      error: null,
    });

    // 2. Set provider cookie for middleware
    document.cookie = [
      `${PROVIDER_COOKIE}=${initialActive}`,
      `max-age=${COOKIE_MAX_AGE}`,
      "path=/",
      "SameSite=Lax",
    ].join("; ");

    // 3. Auth0: rehydrate auth-user store from sessionStorage
    if (initialActive === "auth0") {
      const stored = sessionStorage.getItem("auth-user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            state?: { accessToken?: string; user?: unknown };
          };
          const { accessToken, user } = parsed.state ?? {};
          if (accessToken && user) {
            useAuthUserStore.setState({
              accessToken,
              user: user as never,
              status: "authenticated",
              error: null,
            });
          }
        } catch {
          // sessionStorage corrupted — ignore
        }
      }
    }
  }, [initialActive]);

  if (initialActive === "clerk") {
    return (
      <ClerkProvider>
        {/* Syncs Clerk session token → auth-user.store on every session change */}
        <AuthTokenSync provider="clerk" />
        {children}
      </ClerkProvider>
    );
  }

  if (initialActive === "auth0") {
    return (
      <Auth0Provider>
        {/* Auth0 token already handled by /callback page */}
        <AuthTokenSync provider="auth0" />
        {children}
      </Auth0Provider>
    );
  }

  return <>{children}</>;
}
