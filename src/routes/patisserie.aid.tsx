import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";
import { isSeasonActive } from "@/lib/season";
import { useSeasons } from "@/lib/seasons-hook";

export const Route = createFileRoute("/patisserie/aid")({
  loader: () => collectionSeo("aid", COLLECTIONS.aid),
  head: ({ loaderData }) => collectionHead(COLLECTIONS.aid, loaderData),
  component: Page,
});

function Page() {
  return (
    <CollectionPage
      collection="aid"
      notice={
        isSeasonActive("aid", useSeasons()) ? undefined : (
          <div className="text-[11px] uppercase tracking-[0.24em] text-gold">
            Sélection Aïd — mise à jour à l'approche de la fête
          </div>
        )
      }
    />
  );
}
