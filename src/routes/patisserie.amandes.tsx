import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";

export const Route = createFileRoute("/patisserie/amandes")({
  loader: () => collectionSeo("amandes", COLLECTIONS.amandes),
  head: ({ loaderData }) => collectionHead(COLLECTIONS.amandes, loaderData),
  component: () => <CollectionPage collection="amandes" />,
});
