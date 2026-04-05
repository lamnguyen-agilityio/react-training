"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import {
  OrderRow,
  OrderRowSkeleton,
  AdminSearch,
  useOrderSearchFilter,
  OrderTableHeader,
} from "@/components/admin";

import { ORDER_STATUS_TABS } from "@/lib/constants/orderStatus";
import { authFetch } from "@/lib/api/client";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  priceAtPurchase: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  total: number;
  page: number;
  limit: number;
  items: Order[];
}

// ==================== OrderListContent ====================
function OrderListContent({
  statusFilter,
  searchFilter,
  accessToken,
}: {
  statusFilter: string;
  searchFilter?: string;
  accessToken: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchOrders = useCallback(
    async (currentPage: number) => {
      if (!accessToken) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });

        if (statusFilter !== "all") params.append("status", statusFilter);
        if (searchFilter) params.append("search", searchFilter);

        const response = await authFetch<OrdersResponse>(
          `/orders?${params.toString()}`,
          accessToken,
        );

        if (currentPage === 1) {
          setOrders(response.items);
        } else {
          setOrders((prev) => [...prev, ...response.items]);
        }

        setHasMore(response.items.length === limit);
        setPage(currentPage);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchFilter, limit, accessToken],
  );

  // Reset và fetch lại khi filter thay đổi
  useEffect(() => {
    setOrders([]);
    setPage(1);
    fetchOrders(1);
  }, [fetchOrders]);

  const loadMore = () => {
    fetchOrders(page + 1);
  };

  if (loading && orders.length === 0) {
    return <OrderListSkeleton />;
  }

  if (orders.length === 0) {
    const description = searchFilter
      ? "Try adjusting your search terms."
      : statusFilter === "all"
        ? "Orders will appear here when customers make purchases."
        : `No ${statusFilter} orders at the moment.`;

    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders found"
        description={description}
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <OrderTableHeader />
          <TableBody>
            {orders.map((order) => (
              <OrderRow key={order.id} {...order} />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}

// ==================== Skeleton ====================
function OrderListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <OrderTableHeader />
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==================== Main Page ====================
export default function OrdersPage() {
  const accessToken = useAuthUserStore(selectAccessToken);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { filter: searchFilter, isSearching } =
    useOrderSearchFilter(searchQuery);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-4">
        <AdminSearch
          placeholder="Search by order # or email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full sm:max-w-xs"
        />

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-max">
              {ORDER_STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Order List */}
      {isSearching ? (
        <OrderListSkeleton />
      ) : (
        <Suspense
          key={`${statusFilter}-${searchFilter ?? ""}`}
          fallback={<OrderListSkeleton />}
        >
          <OrderListContent
            statusFilter={statusFilter}
            searchFilter={searchFilter}
            accessToken={accessToken as string}
          />
        </Suspense>
      )}
    </div>
  );
}
