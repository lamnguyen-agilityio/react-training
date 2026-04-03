/**
 * lib/store/auth-user.store.ts
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuthMe } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

const AUTH_SESSION_COOKIE = "x-auth0-session";
const COOKIE_MAX_AGE = 60 * 60 * 2;

function setAuth0SessionCookie() {
  document.cookie = [
    `${AUTH_SESSION_COOKIE}=1`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

function clearAuth0SessionCookie() {
  document.cookie = `${AUTH_SESSION_COOKIE}=; max-age=0; path=/`;
}

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthUserState {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

interface AuthUserActions {
  setTokenAndFetchUser: (accessToken: string) => Promise<void>;
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
          setAuth0SessionCookie();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch user";
          set({
            status: "error",
            error: message,
            accessToken: null,
            user: null,
          });
          clearAuth0SessionCookie();
        }
      },

      logout: () => {
        set({ accessToken: null, user: null, status: "idle", error: null });
        clearAuth0SessionCookie();
      },
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
);

export const selectUser = (s: AuthUserState) => s.user;
export const selectAccessToken = (s: AuthUserState) => s.accessToken;
export const selectAuthStatus = (s: AuthUserState) => s.status;
export const selectIsAuthenticated = (s: AuthUserState) =>
  s.status === "authenticated" && s.user !== null;
