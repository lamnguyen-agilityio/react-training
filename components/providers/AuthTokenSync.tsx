"use client";

import { useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
import { getAuthMe } from "@/lib/api/auth";
import type { AuthProviderName } from "@/lib/api/auth";

// ── Clerk sync ────────────────────────────────────────────────────────────────
// This component is ONLY rendered inside <ClerkProvider> so useAuth() is safe.

function ClerkTokenSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  const syncToken = useCallback(async () => {
    if (!isSignedIn || !userId) {
      useAuthUserStore.setState({
        accessToken: null,
        user: null,
        status: "idle",
        error: null,
      });
      return;
    }

    // getToken() always returns a fresh valid token — Clerk handles refresh internally
    const token = await getToken();
    if (!token) return;

    try {
      const user = await getAuthMe(token);
      useAuthUserStore.setState({
        accessToken: token,
        user,
        status: "authenticated",
        error: null,
      });
    } catch {
      useAuthUserStore.setState({
        accessToken: token,
        user: { userId, email: "", name: "", role: "user" },
        status: "authenticated",
        error: null,
      });
    }
  }, [isSignedIn, userId, getToken]);

  // Sync on sign-in/out change
  useEffect(() => {
    syncToken();
  }, [syncToken]);

  return null;
}

// ── Auth0 sync ────────────────────────────────────────────────────────────────
// Token + user already handled by /callback + sessionStorage rehydration.

function Auth0TokenSync() {
  return null;
}

// ── Public export ─────────────────────────────────────────────────────────────

interface AuthTokenSyncProps {
  provider: AuthProviderName;
}

export function AuthTokenSync({ provider }: AuthTokenSyncProps) {
  if (provider === "clerk") return <ClerkTokenSync />;
  if (provider === "auth0") return <Auth0TokenSync />;
  return null;
}
