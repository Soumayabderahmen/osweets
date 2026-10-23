import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";

export const Route = createFileRoute("/patisserie/tradition")({
  loader: () => collectionSeo("tradition", COLLECTIONS.tradition),
  head: ({ loaderData }) => collectionHead(COLLECTIONS.tradition, loaderData),
  component: () => <CollectionPage collection="tradition" />,
});
