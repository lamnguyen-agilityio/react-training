"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
import { getAuthMe } from "@/lib/api/auth";
import type { AuthProviderName } from "@/lib/api/auth";

// ── Clerk sync ────────────────────────────────────────────────────────────────
// This component is ONLY rendered inside <ClerkProvider> so useAuth() is safe.

function ClerkTokenSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isSignedIn || !userId) {
      useAuthUserStore.setState({
        accessToken: null,
        user: null,
        status: "idle",
        error: null,
      });
      return;
    }

    getToken().then(async (token) => {
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
        // Fallback — store token without full user info
        useAuthUserStore.setState({
          accessToken: token,
          user: { userId, email: "", name: "", role: "user" },
          status: "authenticated",
          error: null,
        });
      }
    });
  }, [isSignedIn, userId, getToken]);

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
