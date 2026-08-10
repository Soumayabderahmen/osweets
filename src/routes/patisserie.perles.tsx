import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import heroImgAsset from "@/assets/plateau-or-assortiment-signature.jpg.asset.json";

const heroImg = heroImgAsset.url;

export const Route = createFileRoute("/patisserie/perles")({
  head: () => collectionHead(COLLECTIONS.perles, heroImg),
  component: () => <CollectionPage collection="perles" heroImage={heroImg} />,
});
