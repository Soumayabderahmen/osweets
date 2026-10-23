// SEO / JSON-LD helpers for Ö' Sweets

import type { Product, ProductVariant } from "@/data/products";
import { displayedProductPrice } from "@/lib/product-rules";

export const SITE = {
  url: "https://osweetspatisserie.lovable.app",
  name: "Ö' Sweets Pâtisserie",
  phone: "+33 6 99 46 60 30",
  streetAddress: "Évry-Courcouronnes",
  addressLocality: "Évry-Courcouronnes",
  postalCode: "91000",
  addressCountry: "FR",
  areaServed: "France",
};

type JsonLd = Record<string, unknown>;

export function jsonLdScript(data: JsonLd) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  } as const;
}

/** Build absolute URL from a site-relative path. */
export function absUrl(path: string): string {
  if (!path) return SITE.url;
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type ProductLike = {
  slug: string;
  name: string;
  shortDesc?: string;
  image?: string;
  price: number;
  inStock?: boolean;
  seasonalOnly?: boolean;
  category?: string;
  variants?: ProductVariant[];
  weight?: string;
  unit?: string;
  hidePrice?: boolean;
  noCart?: boolean;
  published?: boolean;
  archived?: boolean;
  draft?: boolean;
  stockQty?: number;
  stockUnlimited?: boolean;
};

/** Schema.org Product JSON-LD with availability aware of Ramadan/Aïd windows. */
export function productJsonLd(
  p: ProductLike,
  opts: { available?: boolean; seasonNotice?: string | null; path?: string } = {},
): JsonLd {
  const url = absUrl(opts.path ?? `/produits/${p.slug}`);
  const image = p.image ? absUrl(p.image) : undefined;
  const offerPrice = displayedProductPrice(p as Product);
  const isAvailable =
    opts.available ??
    ((p.inStock ?? true) &&
      p.published !== false &&
      !p.archived &&
      !p.draft &&
      !p.hidePrice &&
      !p.noCart &&
      (p.stockUnlimited !== false || (p.stockQty ?? 0) > 0));
  const availability = isAvailable
    ? "https://schema.org/InStock"
    : p.seasonalOnly && p.inStock !== false && (p.stockUnlimited !== false || (p.stockQty ?? 0) > 0)
      ? "https://schema.org/SeasonalItemAvailability"
      : "https://schema.org/OutOfStock";
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDesc ?? "",
    sku: p.slug,
    url,
    brand: { "@type": "Brand", name: SITE.name },
    category: p.category,
  };
  if (offerPrice > 0) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: offerPrice.toFixed(2),
      url,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE.name },
    };
  }
  if (image) data.image = image;
  if (opts.seasonNotice) data.disambiguatingDescription = opts.seasonNotice;
  return data;
}

/** Schema.org ItemList JSON-LD for a category / listing page. */
export function itemListJsonLd(opts: {
  name: string;
  path: string;
  items: ProductLike[];
  availability?: (p: ProductLike) => boolean;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: absUrl(opts.path),
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absUrl(`/produits/${p.slug}`),
      item: productJsonLd(p, {
        available: opts.availability ? opts.availability(p) : undefined,
      }),
    })),
  };
}

export function organization(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.streetAddress,
      addressLocality: SITE.addressLocality,
      postalCode: SITE.postalCode,
      addressCountry: SITE.addressCountry,
    },
    areaServed: SITE.areaServed,
  };
}

export function bakery(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    priceRange: "€€€",
    servesCuisine: ["Tunisienne", "Française", "Orientale"],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.streetAddress,
      addressLocality: SITE.addressLocality,
      postalCode: SITE.postalCode,
      addressCountry: SITE.addressCountry,
    },
    areaServed: SITE.areaServed,
  };
}

export function breadcrumb(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

export function service(opts: {
  name: string;
  description: string;
  serviceType: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    url: `${SITE.url}${opts.path}`,
    provider: {
      "@type": "Bakery",
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.addressLocality,
        postalCode: SITE.postalCode,
        addressCountry: SITE.addressCountry,
      },
    },
    areaServed: SITE.areaServed,
  };
}

export function faqPage(items: { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Build a full head() meta+links+scripts block for an event page. */
export function eventHead(opts: {
  title: string;
  description: string;
  path: string;
  serviceType: string;
  crumbs: { name: string; path: string }[];
  faqs?: { q: string; a: string }[];
  ogImage?: string;
}) {
  const scripts = [
    jsonLdScript(
      service({
        name: opts.title,
        description: opts.description,
        serviceType: opts.serviceType,
        path: opts.path,
      }),
    ),
    jsonLdScript(breadcrumb(opts.crumbs)),
  ];
  if (opts.faqs && opts.faqs.length) scripts.push(jsonLdScript(faqPage(opts.faqs)));

  const meta = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE.url}${opts.path}` },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (opts.ogImage) meta.push({ property: "og:image", content: opts.ogImage });

  return {
    meta,
    links: [{ rel: "canonical", href: `${SITE.url}${opts.path}` }],
    scripts,
  };
}
