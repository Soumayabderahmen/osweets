import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";

export const Route = createFileRoute("/patisserie/pistache-machmoum-pignon")({
  loader: () => collectionSeo("pistache-machmoum-pignon", COLLECTIONS["pistache-machmoum-pignon"]),
  head: ({ loaderData }) => collectionHead(COLLECTIONS["pistache-machmoum-pignon"], loaderData),
  component: () => (
    <CollectionPage collection="pistache-machmoum-pignon" />
  ),
});
