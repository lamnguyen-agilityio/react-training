"use client";

import { useEffect } from "react";
import { useAuthProviderStore } from "@/lib/store/auth-provider.store";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
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

    document.cookie = [
      `${PROVIDER_COOKIE}=${initialActive}`,
      `max-age=${COOKIE_MAX_AGE}`,
      "path=/",
      "SameSite=Lax",
    ].join("; ");

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
        } catch {}
      }
    }
  }, [initialActive]);

  if (initialActive === "clerk") {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  if (initialActive === "auth0") {
    return <Auth0Provider>{children}</Auth0Provider>;
  }

  return <>{children}</>;
}
