import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead, collectionSeo } from "@/lib/collection-head";
import { isSeasonActive } from "@/lib/season";
import { useSeasons } from "@/lib/seasons-hook";

export const Route = createFileRoute("/patisserie/ramadan")({
  loader: () => collectionSeo("ramadan", COLLECTIONS.ramadan),
  head: ({ loaderData }) => collectionHead(COLLECTIONS.ramadan, loaderData),
  component: Page,
});

function Page() {
  return (
    <CollectionPage
      collection="ramadan"
      notice={
        isSeasonActive("ramadan", useSeasons()) ? undefined : (
          <div className="text-[11px] uppercase tracking-[0.24em] text-gold">
            Sélection Ramadan — mise en avant à l'approche du mois sacré
          </div>
        )
      }
    />
  );
}
