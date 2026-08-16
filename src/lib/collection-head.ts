import { SITE, absUrl } from "@/lib/seo";
import type { CollectionDef } from "@/lib/patisserie";

/** Métadonnées SEO communes aux 6 pages collection « Pâtisserie Tunisienne ». */
export function collectionHead(def: CollectionDef, image?: string) {
  const url = `${SITE.url}${def.path}`;
  // Les visuels importés par Vite sont des chemins locaux (/assets/…) :
  // on les absolutise, sinon Facebook/WhatsApp n'affichent aucune vignette.
  const abs = image ? absUrl(image) : undefined;
  return {
    meta: [
      { title: def.title },
      { name: "description", content: def.description },
      { property: "og:title", content: def.title },
      { property: "og:description", content: def.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      ...(abs
        ? [
            { property: "og:image", content: abs },
            { name: "twitter:image", content: abs },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
