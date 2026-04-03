/**
 * lib/store/auth-user.store.ts
 * ─────────────────────────────
 * Stores the Auth0 access token + current user info.
 * Populated by the /callback page after a successful login.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuthMe } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthUserState {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

interface AuthUserActions {
  /** Called by the callback page with the raw token from the URL hash */
  setTokenAndFetchUser: (accessToken: string) => Promise<void>;
  /** Clear everything on sign-out */
  logout: () => void;
}

export const useAuthUserStore = create<AuthUserState & AuthUserActions>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      status: "idle",
      error: null,

      setTokenAndFetchUser: async (accessToken) => {
        set({ status: "loading", error: null, accessToken });

        try {
          const user = await getAuthMe(accessToken);
          set({ user, status: "authenticated", error: null });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch user";
          set({
            status: "error",
            error: message,
            accessToken: null,
            user: null,
          });
        }
      },

      logout: () => {
        set({ accessToken: null, user: null, status: "idle", error: null });
      },
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist token + user — not loading/error state
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
);

// ── Selectors ──────────────────────────────────────────────────────────────────

export const selectUser = (s: AuthUserState) => s.user;
export const selectAccessToken = (s: AuthUserState) => s.accessToken;
export const selectAuthStatus = (s: AuthUserState) => s.status;
export const selectIsAuthenticated = (s: AuthUserState) =>
  s.status === "authenticated" && s.user !== null;
