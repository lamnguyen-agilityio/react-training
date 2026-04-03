/**
 * components/providers/AuthProviderGate.tsx
 * ───────────────────────────────────────────
 * "use client" wrapper that:
 *  1. Calls store.load() once on mount
 *  2. Renders the correct auth provider (Clerk / Auth0) when ready
 *  3. Shows a fallback while loading, or an error state on failure
 *
 * Usage — place this high in the tree, e.g. inside app/layout.tsx:
 *
 *   <AuthProviderGate>
 *     {children}
 *   </AuthProviderGate>
 */

"use client";

import { useEffect } from "react";
import {
  useAuthProviderStore,
  selectActiveProvider,
  selectProviderStatus,
  selectProviderError,
} from "@/lib/store/auth-provider.store";

// Lazy-import the real auth provider SDKs so they are only
// loaded for the branch that is actually active.
import { ClerkProvider } from "@clerk/nextjs";
import { Auth0Provider } from "@auth0/nextjs-auth0";

interface AuthProviderGateProps {
  children: React.ReactNode;
  /** Optional override for the loading UI */
  fallback?: React.ReactNode;
}

export function AuthProviderGate({ children, fallback }: AuthProviderGateProps) {
  const load   = useAuthProviderStore((s) => s.load);
  const status = useAuthProviderStore(selectProviderStatus);
  const active = useAuthProviderStore(selectActiveProvider);
  const error  = useAuthProviderStore(selectProviderError);

  // Load once on mount — store skips duplicate calls automatically
  useEffect(() => {
    load();
  }, [load]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "idle" || status === "loading") {
    return <>{fallback ?? null}</>;
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (status === "error") {
    // In production you may want to render children anyway with a degraded
    // experience, or redirect to an error page. Adjust to your needs.
    console.error("[AuthProviderGate]", error);
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-500">
        Failed to initialise authentication. Please refresh the page.
      </div>
    );
  }

  // ── Success: render the correct provider ─────────────────────────────────
  if (active === "clerk") {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  if (active === "auth0") {
    return <Auth0Provider>{children}</Auth0Provider>;
  }

  // Fallback — unknown provider value from API
  console.warn("[AuthProviderGate] Unknown provider:", active);
  return <>{children}</>;
}
