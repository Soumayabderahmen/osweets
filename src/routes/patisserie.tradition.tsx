import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import heroImg from "@/assets/p-ghrayba.jpg";

export const Route = createFileRoute("/patisserie/tradition")({
  head: () => collectionHead(COLLECTIONS.tradition, heroImg),
  component: () => <CollectionPage collection="tradition" heroImage={heroImg} />,
});
