/**
 * components/providers/AuthProviderGateClient.tsx
 * ─────────────────────────────────────────────────
 * Client Component that:
 *  - Seeds the Zustand store with the value resolved on the server
 *  - Renders the correct auth provider SDK without any loading state
 *
 * Used exclusively by AuthProviderGate.server.tsx.
 * Do not use this directly — use AuthProviderGateServer instead.
 */

"use client";

import { useEffect } from "react";
import { useAuthProviderStore } from "@/lib/store/auth-provider.store";
import type { AuthProviderName } from "@/lib/api/auth";

import { ClerkProvider } from "@clerk/nextjs";
import { Auth0Provider } from "@auth0/nextjs-auth0";

interface Props {
  initialActive: AuthProviderName;
  children: React.ReactNode;
}

export function AuthProviderGateClient({ initialActive, children }: Props) {
  // Seed the store once so any component in the tree can read it
  // without triggering another API call.
  useEffect(() => {
    useAuthProviderStore.setState({
      active: initialActive,
      available: [initialActive],
      status: "success",
      error: null,
    });
  }, [initialActive]);

  if (initialActive === "clerk") {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  if (initialActive === "auth0") {
    return <Auth0Provider>{children}</Auth0Provider>;
  }

  return <>{children}</>;
}
