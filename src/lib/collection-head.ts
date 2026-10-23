import { notFound } from "@tanstack/react-router";
import { SITE, absUrl } from "@/lib/seo";
import type { CollectionDef } from "@/lib/patisserie";
import { listCollections } from "@/api/collections";
import { collectionMetadata } from "@/lib/collection-presentation";

/**
 * Ce que Google et les réseaux affichent pour une collection.
 *
 * `head()` ne peut pas appeler de crochet : les valeurs passent donc par
 * le chargeur de la route. Auparavant seule l'image venait de la base —
 * le titre et la description restaient ceux du code, si bien que la
 * section « Ce que Google affiche » du back-office ne produisait aucun
 * effet sur les six pages historiques.
 */
export interface CollectionSeo {
  title: string;
  description: string;
  image?: string;
}

/**
 * Les métadonnées d'une collection, lues en base.
 *
 * Un champ SEO vide utilise uniquement le nom administré, jamais une
 * ancienne promesse commerciale issue du code.
 */
export async function collectionSeo(slug: string, _secours: CollectionDef): Promise<CollectionSeo> {
  const all = await listCollections().catch(() => []);
  const row = all.find((c) => c.slug === slug);
  if (!row || !row.published || row.hidden) throw notFound();
  return {
    ...collectionMetadata(row),
    image: row?.image_url || undefined,
  };
}

/** Métadonnées SEO d'une page collection « Pâtisserie Tunisienne ». */
export function collectionHead(def: CollectionDef, seo?: CollectionSeo | null) {
  const url = `${SITE.url}${def.path}`;
  const title = seo?.title ?? "Pâtisserie Tunisienne | Ö' Sweets";
  const description = seo?.description ?? "";
  // L'adresse vient de la base (/api/public/media/…) : on l'absolutise,
  // sinon Facebook et WhatsApp n'affichent aucune vignette.
  const abs = seo?.image ? absUrl(seo.image) : undefined;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
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
