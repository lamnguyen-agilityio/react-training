/**
 * components/app/HeaderAuth.tsx
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Package, User, Github, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useAuthProviderStore,
  selectActiveProvider,
  selectIsProviderReady,
} from "@/lib/store/auth-provider.store";
import { useCartStore } from "@/lib/store/cart-store-provider";

import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
} from "@clerk/nextjs";

import {
  useAuthUserStore,
  selectUser,
  selectIsAuthenticated,
  selectAuthStatus,
} from "@/lib/store/auth-user.store";

// ── Auth0 login URLs ──────────────────────────────────────────────────────────

const AUTH0_LOGIN = {
  google: process.env.NEXT_PUBLIC_AUTH0_GOOGLE_LOGIN_URL,
  github: process.env.NEXT_PUBLIC_AUTH0_GITHUB_LOGIN_URL,
} as const;

// ── Google icon (SVG — lucide doesn't have one) ───────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Auth0 sign-in dropdown ────────────────────────────────────────────────────

function Auth0SignInDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => setOpen((v) => !v)}
      >
        <User className="h-5 w-5" />
        <span className="text-sm font-medium">Sign in</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="px-3 py-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            Continue with
          </div>

          <a
            href={AUTH0_LOGIN.google}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => setOpen(false)}
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>Google</span>
          </a>

          <a
            href={AUTH0_LOGIN.github}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => setOpen(false)}
          >
            <Github className="h-4 w-4 shrink-0" />
            <span>GitHub</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Auth0 user menu dropdown ──────────────────────────────────────────────────

interface Auth0UserMenuProps {
  picture?: string;
  name?: string;
  onLogout: () => void;
}

function Auth0UserMenu({ picture, name, onLogout }: Auth0UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-zinc-300 focus:outline-none dark:hover:ring-zinc-700"
      >
        {picture ? (
          <img
            src={picture}
            alt={name ?? "User"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {/* User info */}
          {name && (
            <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {name}
              </p>
            </div>
          )}

          {/* My Orders */}
          <Link
            href="/orders"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => setOpen(false)}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span>My Orders</span>
          </Link>

          {/* Sign out */}
          <button
            onClick={() => {
              setOpen(false);
              clearCart();
              onLogout();
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-3 border-t border-zinc-100 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Provider implementations ──────────────────────────────────────────────────

function ClerkAuth() {
  return (
    <>
      <ClerkSignedIn>
        <Button asChild>
          <Link href="/orders" className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">My Orders</span>
          </Link>
        </Button>
      </ClerkSignedIn>

      <ClerkSignedIn>
        <ClerkUserButton
          afterSwitchSessionUrl="/"
          appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        >
          <ClerkUserButton.MenuItems>
            <ClerkUserButton.Link
              label="My Orders"
              labelIcon={<Package className="h-4 w-4" />}
              href="/orders"
            />
          </ClerkUserButton.MenuItems>
        </ClerkUserButton>
      </ClerkSignedIn>

      <ClerkSignedOut>
        <ClerkSignInButton mode="modal">
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Sign in</span>
          </Button>
        </ClerkSignInButton>
      </ClerkSignedOut>
    </>
  );
}

function Auth0Auth() {
  const status = useAuthUserStore(selectAuthStatus);
  const user = useAuthUserStore(selectUser);
  const isAuthenticated = useAuthUserStore(selectIsAuthenticated);
  const logout = useAuthUserStore((s) => s.logout);

  if (status === "loading") return <AuthSkeleton />;

  if (isAuthenticated && user) {
    return (
      <Auth0UserMenu
        picture={undefined} // Auth0 /auth/me response has no picture field
        name={user.name}
        onLogout={() => {
          logout();
        }}
      />
    );
  }

  return <Auth0SignInDropdown />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AuthSkeleton() {
  return (
    <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function HeaderAuth() {
  const active = useAuthProviderStore(selectActiveProvider);
  const isReady = useAuthProviderStore(selectIsProviderReady);

  if (!isReady) return <AuthSkeleton />;
  if (active === "clerk") return <ClerkAuth />;
  if (active === "auth0") return <Auth0Auth />;

  return null;
}
