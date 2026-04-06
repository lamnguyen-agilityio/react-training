import { Suspense } from "react";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import { getProducts, getCategories, ApiError } from "@/lib/api";
import { HomeProductSection } from "@/components/app/HomeProductSection";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categorySlug?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const searchQuery  = params.search ?? "";
  const categorySlug = params.categorySlug ?? "";
  const minPrice     = Number(params.minPrice) || 0;
  const maxPrice     = Number(params.maxPrice) || 0;
  const sortBy       = params.sortBy ?? "name";
  const sortOrder    = params.sortOrder ?? "desc";
  const limit        = Number(params.limit) || 10;

  const [productsResult, categoriesResult, featuredProductsResult] =
    await Promise.allSettled([
      getProducts({
        search: searchQuery || undefined,
        categorySlug: categorySlug || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        sortOrder,
        page: 1,
        limit,
      }),
      getCategories(),
      getProducts({ limit: 5 }),
    ]);

  const productsData =
    productsResult.status === "fulfilled" ? productsResult.value : null;
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const featuredProducts =
    featuredProductsResult.status === "fulfilled"
      ? featuredProductsResult.value?.items?.slice(0, 5)
      : [];

  if (productsResult.status === "rejected") {
    const err = productsResult.reason;
    console.error(
      "[HomePage] Failed to fetch products:",
      err instanceof ApiError ? `${err.status} ${err.message}` : err,
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Shop {categorySlug ? categorySlug : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Premium furniture for your home
          </p>
        </div>
        <div className="mt-6">
          <CategoryTiles
            categories={categories}
            activeCategory={categorySlug || undefined}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Client component handles load more state */}
        <HomeProductSection
          categories={categories}
          initialProducts={productsData?.items ?? []}
          initialTotal={productsData?.total ?? 0}
          initialSearchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
