import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import heroImg from "@/assets/plateau-or-assortiment-signature.jpg";

export const Route = createFileRoute("/patisserie/perles")({
  head: () => collectionHead(COLLECTIONS.perles, heroImg),
  component: () => <CollectionPage collection="perles" heroImage={heroImg} />,
});
