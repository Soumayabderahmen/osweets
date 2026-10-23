import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProductImages } from "@/api/images";
import { ProductImage } from "@/components/ProductImage";

/**
 * Grande image + miniatures.
 *
 * Les images viennent de la base (`product_images`). S'il n'y en a qu'une —
 * ou aucune —, on retrouve exactement l'affichage d'origine : pas de
 * miniatures sous la photo.
 */
export function ProductGallery({
  slug,
  name,
  fallback,
  badge,
}: {
  slug: string;
  name: string;
  /** Photo de la fiche, utilisée tant que la galerie est vide. */
  fallback?: string;
  badge?: React.ReactNode;
}) {
  const { data } = useQuery({
    queryKey: ["product-images", slug],
    queryFn: () => listProductImages({ data: { slug } }),
    staleTime: 60_000,
    retry: false,
  });

  const gallery = (data ?? []).map((i) => i.url);
  const images = gallery.length ? gallery : fallback ? [fallback] : [];
  const [active, setActive] = useState(0);

  // Une nouvelle fiche (ou une galerie qui arrive) repart de la première image.
  useEffect(() => {
    setActive(0);
  }, [slug, gallery.length]);

  const current = images[Math.min(active, images.length - 1)] ?? fallback;

  return (
    <div>
      <div className="relative aspect-square bg-sand">
        <ProductImage src={current} alt={name} loading="eager" placeholderClassName="text-7xl" />
        {badge}
      </div>

      {images.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Voir la photo ${i + 1} de ${name}`}
              aria-current={i === active}
              className={`relative h-20 w-20 shrink-0 overflow-hidden bg-sand transition ${
                i === active ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "opacity-80 hover:opacity-100"
              }`}
            >
              <ProductImage src={src} alt="" placeholderClassName="text-2xl" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
