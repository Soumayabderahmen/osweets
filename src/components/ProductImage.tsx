import { useState } from "react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Taille du « Ö » du placeholder. */
  placeholderClassName?: string;
  loading?: "lazy" | "eager";
}

/**
 * Photo produit éditoriale : si l'image manque ou échoue, on affiche un
 * placeholder sable avec le monogramme Ö' Sweets — jamais de visuel cassé.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  placeholderClassName = "text-5xl",
  loading = "lazy",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={`img-placeholder h-full w-full ${className}`}
      >
        <span className={placeholderClassName}>Ö</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
