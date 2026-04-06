"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingCart, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { StatCard, LowStockAlert, RecentOrders } from "@/components/admin";
import { useAuthProviderStore, selectActiveProvider } from "@/lib/store/auth-provider.store";
import { useAuthUserStore, selectAccessToken } from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ClerkSignOutTrigger } from "@/components/providers/ClerkSignOutTrigger";
import type { AuthProviderName } from "@/lib/api/auth";

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  from: AuthProviderName;
  to: AuthProviderName;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({ from, to, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <h2 className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Switch to {cap(to)}?
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          This will switch from{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{cap(from)}</span>
          {" "}to{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{cap(to)}</span>
          . You will be logged out and need to sign in again.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Switching...</>
              : "Confirm"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Provider Switch ───────────────────────────────────────────────────────────

function ProviderSwitch() {
  const active      = useAuthProviderStore(selectActiveProvider);
  const accessToken = useAuthUserStore(selectAccessToken);
  const logout      = useAuthUserStore((s) => s.logout);

  const [pendingProvider, setPendingProvider] = useState<AuthProviderName | null>(null);
  const [switching, setSwitching]             = useState(false);
  // Trigger Clerk sign-out only when active === "clerk" and API call succeeded
  const [triggerClerkSignOut, setTriggerClerkSignOut] = useState(false);

  const handleClick = (provider: AuthProviderName) => {
    if (provider === active || switching) return;
    setPendingProvider(provider);
  };

  const handleConfirm = async () => {
    if (!pendingProvider || !accessToken) return;

    setSwitching(true);
    try {
      const res = await authFetch<{ active: AuthProviderName; available: AuthProviderName[] }>(
        "/auth/provider",
        accessToken,
        { method: "POST", body: { provider: pendingProvider } },
      );

      // Update provider store + cookie
      useAuthProviderStore.setState({
        active: res.active,
        available: res.available,
        status: "success",
        error: null,
      });
      document.cookie = `x-auth-provider=${res.active}; max-age=${60 * 60 * 24}; path=/; SameSite=Lax`;

      // Clear auth-user store
      logout();

      if (active === "clerk") {
        // Mount ClerkSignOutTrigger — it will call signOut() then redirect
        setTriggerClerkSignOut(true);
      } else {
        // Auth0: no SDK session to clear, redirect directly
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[ProviderSwitch] failed:", err);
      setSwitching(false);
      setPendingProvider(null);
    }
  };

  const handleCancel = () => {
    if (switching) return;
    setPendingProvider(null);
  };

  const providers: { id: AuthProviderName; label: string }[] = [
    { id: "clerk", label: "Clerk" },
    { id: "auth0", label: "Auth0" },
  ];

  return (
    <>
      {/* Clerk sign-out trigger — only mounted when active === "clerk" and switch confirmed */}
      {triggerClerkSignOut && (
        <ClerkSignOutTrigger onDone={() => { window.location.href = "/"; }} />
      )}

      <div className="flex items-center gap-2">
        {switching && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {providers.map((p) => {
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleClick(p.id)}
                disabled={switching}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                  switching && !isActive ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {pendingProvider && active && !triggerClerkSignOut && (
        <ConfirmDialog
          from={active}
          to={pendingProvider}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={switching}
        />
      )}
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Overview of your store
          </p>
        </div>
        <ProviderSwitch />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Products"  icon={Package}       documentType="products" href="/admin/inventory" />
        <StatCard title="Total Orders"    icon={ShoppingCart}  documentType="orders"   href="/admin/orders" />
        <StatCard title="Low Stock Items" icon={TrendingUp}    documentType="products" warningStock={5} href="/admin/inventory" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockAlert />
        <RecentOrders />
      </div>
    </div>
  );
}
