import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/patisserie/CollectionPage";
import { COLLECTIONS } from "@/lib/patisserie";
import { collectionHead } from "@/lib/collection-head";
import { isAidActive } from "@/lib/season";
import heroImg from "@/assets/collection-aid-eid-mubarak.jpg";

export const Route = createFileRoute("/patisserie/aid")({
  head: () => collectionHead(COLLECTIONS.aid, heroImg),
  component: Page,
});

function Page() {
  return (
    <CollectionPage
      collection="aid"
      heroImage={heroImg}
      notice={
        isAidActive() ? undefined : (
          <div className="text-[11px] uppercase tracking-[0.24em] text-gold">
            Sélection Aïd — mise à jour à l'approche de la fête
          </div>
        )
      }
    />
  );
}
