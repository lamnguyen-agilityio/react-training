"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaginatedResponse {
  total: number;
  page: number;
  limit: number;
  items: unknown[];
}

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  documentType: string;
  filter?: string;
  warningStock?: number;
  valueFormatter?: (count: number) => string;
  href?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatCardSkeleton({
  title,
  icon: Icon,
}: Pick<StatCardProps, "title" | "icon">) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <Skeleton className="mt-2 h-9 w-20" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function StatCardContent({
  title,
  icon: Icon,
  documentType,
  filter,
  warningStock,
  valueFormatter = (count) => count.toString(),
  href,
}: StatCardProps) {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const qs = filter ? `?${filter}` : "";
    const url = `/${documentType}${qs}`;

    authFetch<PaginatedResponse>(url, accessToken)
      .then((res) => {
        if (warningStock !== undefined) {
          const lowStock = (res.items as { quantityInStock?: number }[]).filter(
            (item) => (item.quantityInStock ?? 0) < warningStock,
          ).length;
          setCount(lowStock);
        } else {
          setCount(res.total ?? res.items?.length ?? 0);
        }
      })
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, [accessToken, documentType, filter, warningStock]);

  const content = (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
        href &&
          "cursor-pointer transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {loading || count === null ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              valueFormatter(count)
            )}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ── Public export ─────────────────────────────────────────────────────────────

export function StatCard(props: StatCardProps) {
  return (
    <Suspense
      fallback={<StatCardSkeleton title={props.title} icon={props.icon} />}
    >
      <StatCardContent {...props} />
    </Suspense>
  );
}
