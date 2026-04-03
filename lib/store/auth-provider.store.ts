/**
 * lib/store/auth-provider.store.ts
 * ──────────────────────────────────
 * Zustand store for the active auth provider.
 *
 * Responsibilities:
 *  - Hold the active provider ("clerk" | "auth0") and available list
 *  - Track loading / error state
 *  - Guarantee the API is only called once (load-once pattern)
 */

import { create } from "zustand";
import { getAuthProvider } from "@/lib/api/auth";
import type { AuthProviderName } from "@/lib/api/auth";

// ── State shape ───────────────────────────────────────────────────────────────

type LoadStatus = "idle" | "loading" | "success" | "error";

interface AuthProviderState {
  /** The currently active provider, null until loaded */
  active: AuthProviderName | null;
  /** All providers the backend supports */
  available: AuthProviderName[];
  status: LoadStatus;
  error: string | null;
}

interface AuthProviderActions {
  /**
   * Fetch the active provider from the API.
   * Skips the call if already loaded or in-flight (load-once).
   */
  load: () => Promise<void>;
  /** Force a fresh fetch regardless of current status (e.g. after admin change) */
  reload: () => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthProviderStore = create<
  AuthProviderState & AuthProviderActions
>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  active: null,
  available: [],
  status: "idle",
  error: null,

  // ── Actions ──────────────────────────────────────────────────────────────
  load: async () => {
    const { status } = get();

    // Skip if already loaded or currently in-flight
    if (status === "loading" || status === "success") return;

    set({ status: "loading", error: null });

    try {
      const data = await getAuthProvider();
      set({
        active: data.active,
        available: data.available,
        status: "success",
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load auth provider";
      set({ status: "error", error: message });
    }
  },

  reload: async () => {
    // Reset to idle so load() won't be skipped
    set({ status: "idle", error: null });
    await get().load();
  },
}));

// ── Selectors (memoised, avoids unnecessary re-renders) ───────────────────────

export const selectActiveProvider = (s: AuthProviderState) => s.active;
export const selectProviderStatus = (s: AuthProviderState) => s.status;
export const selectProviderError = (s: AuthProviderState) => s.error;
export const selectIsProviderReady = (s: AuthProviderState) =>
  s.status === "success" && s.active !== null;
