import { createFileRoute, notFound } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { listCollections } from "@/api/collections";
import { absUrl, SITE } from "@/lib/seo";
import { collectionMetadata } from "@/lib/collection-presentation";

/**
 * Page générique d'une collection créée depuis le back-office.
 * Les six collections historiques gardent leur fichier dédié (routes
 * statiques prioritaires) ; toute collection ajoutée en base obtient sa page
 * ici, sans passer par le code.
 */
export const Route = createFileRoute("/patisserie/$slug")({
  // Les titres viennent de la base : sans ce chargement, Google afficherait
  // l'adresse brute (« pistache-machmoum-pignon ») au lieu du nom.
  loader: async ({ params }) => {
    const all = await listCollections().catch(() => []);
    const row = all.find((c) => c.slug === params.slug && c.published && !c.hidden);
    if (!row) throw notFound();
    return row;
  },
  head: ({ loaderData, params }) => {
    const c = loaderData;
    const name = c?.label ?? params.slug;
    const { title, description } = collectionMetadata(
      c ?? { label: name, title: "", description: "" },
    );
    const path = `/patisserie/${params.slug}`;
    const image = c?.image_url ? absUrl(c.image_url) : undefined;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absUrl(path) },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `${SITE.url}${path}` }],
    };
  },
  component: DynamicCollection,
});

function DynamicCollection() {
  const { slug } = Route.useParams();
  return <CollectionPage collection={slug} />;
}
