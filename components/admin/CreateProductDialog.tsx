"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publicGet, authFetch } from "@/lib/api/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
}

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
}

// Default form (image giờ là File | null)
const defaultForm = {
  name: "",
  description: "",
  price: "",
  quantityInStock: "",
  categoryId: "",
  image: null as File | null,
};

export function CreateProductDialog({
  open,
  onOpenChange,
  accessToken,
}: CreateProductDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    publicGet<Category[]>("/categories")
      .then((res) => setCategories(res ?? []))
      .catch((err) =>
        console.error("[CreateProductDialog] fetch categories:", err),
      )
      .finally(() => setLoadingCategories(false));
  }, [open]);

  // Reset form khi đóng dialog
  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setErrors({});
      setImagePreview(null);
    }
  }, [open]);

  const handleInputChange =
    (field: keyof Omit<typeof defaultForm, "image">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));

    // Preview image
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const validate = () => {
    const next: Partial<typeof defaultForm> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      next.price = "Valid price is required";
    if (
      !form.quantityInStock ||
      isNaN(Number(form.quantityInStock)) ||
      Number(form.quantityInStock) < 0
    )
      next.quantityInStock = "Valid quantity is required";
    if (!form.categoryId) next.categoryId = "Category is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim() || "");
      formData.append("price", form.price);
      formData.append("quantityInStock", form.quantityInStock);
      formData.append("categoryId", form.categoryId);

      if (form.image) {
        formData.append("image", form.image);
      }

      const product = await authFetch<Product>("/products", accessToken, {
        method: "POST",
        body: formData,
      });

      onOpenChange(false);
      router.push(`/admin/inventory/${product.slug}`);
      router.refresh();
    } catch (err) {
      console.error("[CreateProductDialog] create failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
        </DialogHeader>

        <form
          id="create-product-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Name *</Label>
            <Input
              id="cp-name"
              placeholder="Product name"
              value={form.name}
              onChange={handleInputChange("name")}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">Description</Label>
            <Textarea
              id="cp-desc"
              placeholder="Product description"
              rows={3}
              value={form.description}
              onChange={handleInputChange("description")}
              disabled={submitting}
              className="resize-none"
            />
          </div>

          {/* Price + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-price">Price *</Label>
              <Input
                id="cp-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={handleInputChange("price")}
                disabled={submitting}
              />
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-qty">Quantity *</Label>
              <Input
                id="cp-qty"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.quantityInStock}
                onChange={handleInputChange("quantityInStock")}
                disabled={submitting}
              />
              {errors.quantityInStock && (
                <p className="text-xs text-red-500">{errors.quantityInStock}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-category">Category *</Label>
            {loadingCategories ? (
              <div className="flex h-10 items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading categories…
              </div>
            ) : (
              <Select
                value={form.categoryId}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, categoryId: val }))
                }
                disabled={submitting}
              >
                <SelectTrigger id="cp-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.categoryId && (
              <p className="text-xs text-red-500">{errors.categoryId}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-image">Product Image</Label>
            <Input
              id="cp-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={submitting}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md border"
                />
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-product-form"
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
