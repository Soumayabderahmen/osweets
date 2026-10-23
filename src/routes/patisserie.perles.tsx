import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";

export const Route = createFileRoute("/patisserie/perles")({
  loader: () => collectionSeo("perles", COLLECTIONS.perles),
  head: ({ loaderData }) => collectionHead(COLLECTIONS.perles, loaderData),
  component: () => <CollectionPage collection="perles" />,
});
