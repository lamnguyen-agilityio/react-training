"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  useAuthUserStore,
  selectAccessToken,
  selectAuthStatus,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const MATERIALS = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "glass", label: "Glass" },
];

const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "oak", label: "Oak" },
  { value: "walnut", label: "Walnut" },
  { value: "grey", label: "Grey" },
  { value: "natural", label: "Natural" },
];

// ── Extended Product type ──────────────────────────────────────────────────────

interface ProductDetail extends Product {
  featured?: boolean;
  assemblyRequired?: boolean;
  material?: string;
  color?: string;
  dimensions?: string;
}

// ── Image Uploader ─────────────────────────────────────────────────────────────

function ImageUploader({
  productId,
  currentImage,
  accessToken,
  onUploaded,
}: {
  productId: string;
  currentImage?: string;
  accessToken: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/products/${productId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );

      if (res.ok) {
        const updated = (await res.json()) as ProductDetail;
        if (updated.image) onUploaded(updated.image);
      }
    } catch (err) {
      console.error("[ImageUploader] upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Product"
            fill
            className="object-cover"
            sizes="300px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <Upload className="h-8 w-8" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {currentImage ? "Change Image" : "Upload Image"}
          </>
        )}
      </Button>
    </div>
  );
}

// ── Delete Button ──────────────────────────────────────────────────────────────

function DeleteButton({
  productId,
  accessToken,
}: {
  productId: string;
  accessToken: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await authFetch(`/products/${productId}`, accessToken, {
        method: "DELETE",
      });
      router.replace("/admin/inventory");
    } catch (err) {
      console.error("[DeleteButton] failed:", err);
      setDeleting(false);
    }
  };

  return (
    <Button
      variant={confirm ? "destructive" : "outline"}
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      onBlur={() => setConfirm(false)}
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Trash2 className="mr-1.5 h-4 w-4" />
          {confirm ? "Confirm Delete" : "Delete"}
        </>
      )}
    </Button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id: slug } = use(params);
  const router = useRouter();
  const accessToken = useAuthUserStore(selectAccessToken);
  const authStatus = useAuthUserStore(selectAuthStatus);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rehydration timeout
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Fetch product
  useEffect(() => {
    const isRehydrating = authStatus === "idle" || authStatus === "loading";
    if (isRehydrating && !timedOut) return;
    if (!accessToken) {
      router.replace("/");
      return;
    }

    authFetch<ProductDetail>(`/products/${slug}`, accessToken)
      .then(setProduct)
      .catch(() => router.replace("/admin/inventory"))
      .finally(() => setLoading(false));
  }, [accessToken, authStatus, timedOut, slug, router]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  // Optimistic update + debounced PUT
  const patch = useCallback(
    (fields: Partial<ProductDetail>) => {
      if (!accessToken) return;
      // Optimistic
      setProduct((prev) => (prev ? { ...prev, ...fields } : prev));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const updated = await authFetch<ProductDetail>(
            `/products/${product?.id}`,
            accessToken,
            {
              method: "PATCH",
              body: fields,
            },
          );
          setProduct(updated);
        } catch (err) {
          console.error("[ProductDetail] save failed:", err);
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [accessToken, product?.id],
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {product.name || "New Product"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            Edit product details
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteButton productId={product.id} accessToken={accessToken!} />
          {product.slug && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/products/${product.slug}`} target="_blank">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                View on store
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={product.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={product.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Pricing & Inventory
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={(e) => patch({ price: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={product.quantityInStock}
                  onChange={(e) =>
                    patch({ quantityInStock: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Product Image
            </h2>
            <ImageUploader
              productId={product.id}
              currentImage={product.image}
              accessToken={accessToken!}
              onUploaded={(url) =>
                setProduct((prev) => (prev ? { ...prev, image: url } : prev))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
