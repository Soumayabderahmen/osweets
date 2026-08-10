import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import { isRamadanActive } from "@/lib/season";
import heroImg from "@/assets/p-samsa.jpg";

export const Route = createFileRoute("/patisserie/ramadan")({
  head: () => collectionHead(COLLECTIONS.ramadan, heroImg),
  component: Page,
});

function Page() {
  return (
    <CollectionPage
      collection="ramadan"
      heroImage={heroImg}
      notice={
        isRamadanActive() ? undefined : (
          <div className="text-[11px] uppercase tracking-[0.24em] text-gold">
            Sélection Ramadan — mise en avant à l'approche du mois sacré
          </div>
        )
      }
    />
  );
}
