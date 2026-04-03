import Image from "next/image";

interface ProductGalleryProps {
  image: string;
  productName: string | null;
}

export function ProductGallery({ image, productName }: ProductGalleryProps) {
  if (!image) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <span className="text-zinc-400">No images available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          <Image
            src={image}
            alt={productName ?? "Product image"}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            No image
          </div>
        )}
      </div>
    </div>
  );
}
