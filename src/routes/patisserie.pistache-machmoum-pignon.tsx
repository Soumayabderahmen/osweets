import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import heroImg from "@/assets/p-baklawa.jpg";

export const Route = createFileRoute("/patisserie/pistache-machmoum-pignon")({
  head: () => collectionHead(COLLECTIONS["pistache-machmoum-pignon"], heroImg),
  component: () => (
    <CollectionPage collection="pistache-machmoum-pignon" heroImage={heroImg} />
  ),
});
