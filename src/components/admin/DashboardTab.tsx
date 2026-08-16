import { useMemo } from "react";
import { AlertTriangle, Bell, FileText, Package, PackageX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProductRow } from "@/lib/catalog";
import type { WaitlistRow } from "@/api/waitlist";
import { COLLECTION_OPTIONS } from "./ProductEditor";

const dateFr = (v: string) =>
  new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** Carte d'indicateur — libellé et chiffre à gauche, pastille dégradée à droite. */
function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutre",
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone?: "neutre" | "alerte";
}) {
  return (
    <div className="card-soft flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charbon/50">
          {label}
        </div>
        <div className="mt-1 font-price text-2xl font-bold leading-tight text-charbon">{value}</div>
        <div className="mt-0.5 truncate text-[11px] text-charbon/45">{hint}</div>
      </div>
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-soft ${
          tone === "alerte" ? "icon-gradient-gold" : "icon-gradient-charbon"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export function DashboardTab({
  rows,
  waitlist,
  onGoTo,
}: {
  rows: ProductRow[];
  waitlist: WaitlistRow[];
  onGoTo: (section: string) => void;
}) {
  const live = useMemo(() => rows.filter((p) => !p.archived), [rows]);

  const stats = useMemo(() => {
    const published = live.filter((p) => p.published);
    const outOfStock = live.filter((p) => !p.in_stock);
    const drafts = live.filter((p) => p.draft || Number(p.price) <= 0);
    const noCollection = live.filter((p) => !(p.collections ?? []).length);
    const noWeight = live.filter((p) => !p.weight && p.pieces === null);

    // Une photo utilisée par plusieurs fiches : le client voit deux fois la même.
    const byImage = new Map<string, number>();
    for (const p of live) {
      const key = p.image_url || p.image_key || "";
      if (key) byImage.set(key, (byImage.get(key) ?? 0) + 1);
    }
    const shared = live.filter((p) => {
      const key = p.image_url || p.image_key || "";
      return key ? (byImage.get(key) ?? 0) > 1 : false;
    });

    return { published, outOfStock, drafts, noCollection, noWeight, shared };
  }, [live]);

  const byCollection = useMemo(() => {
    const counts = COLLECTION_OPTIONS.map((c) => ({
      label: c.label,
      count: live.filter((p) => (p.collections ?? []).includes(c.value)).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [live]);

  const recent = useMemo(
    () =>
      [...live]
        .sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")))
        .slice(0, 6),
    [live],
  );

  const todo = [
    { label: "produits épuisés", n: stats.outOfStock.length, hint: "commande bloquée" },
    { label: "fiches sans prix", n: stats.drafts.length, hint: "en brouillon, hors sitemap" },
    {
      label: "produits sans collection",
      n: stats.noCollection.length,
      hint: "page complète seulement",
    },
    { label: "sans poids ni nombre de pièces", n: stats.noWeight.length, hint: "info manquante" },
    { label: "photos partagées", n: stats.shared.length, hint: "plusieurs fiches, même visuel" },
  ].filter((t) => t.n > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Produits en ligne"
          value={stats.published.length}
          hint={`sur ${live.length} fiches au catalogue`}
          icon={Package}
        />
        <Kpi
          label="Épuisés"
          value={stats.outOfStock.length}
          hint="commande bloquée"
          icon={PackageX}
          tone={stats.outOfStock.length ? "alerte" : "neutre"}
        />
        <Kpi
          label="Brouillons"
          value={stats.drafts.length}
          hint="prix à renseigner"
          icon={FileText}
          tone={stats.drafts.length ? "alerte" : "neutre"}
        />
        <Kpi
          label="Liste d'attente"
          value={waitlist.length}
          hint="clientes à prévenir"
          icon={Bell}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Répartition par collection */}
        <div className="card-soft p-6">
          <h2 className="font-display text-lg">Produits par collection</h2>
          <p className="mt-1 text-xs text-charbon/50">
            Une collection vide s'affiche comme « bientôt disponible ».
          </p>
          <div className="mt-6 space-y-4">
            {byCollection.counts.map((c) => (
              <div key={c.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charbon/60">
                    {c.label}
                  </span>
                  <span className="font-price text-sm font-bold text-charbon">{c.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sable">
                  <div
                    className="h-full rounded-full icon-gradient-gold"
                    style={{ width: `${Math.max(2, (c.count / byCollection.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* À traiter */}
        <div className="card-soft flex flex-col p-6">
          <h2 className="font-display text-lg">À traiter</h2>
          <p className="mt-1 text-xs text-charbon/50">Ce qui mérite votre attention.</p>
          {todo.length === 0 ? (
            <p className="mt-6 text-sm text-charbon/60">
              Rien à signaler — le catalogue est complet.
            </p>
          ) : (
            <ul className="mt-5 flex-1 space-y-4">
              {todo.map((t) => (
                <li key={t.label} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm text-charbon">
                      <strong className="font-price font-bold">{t.n}</strong> {t.label}
                    </div>
                    <div className="text-[11px] text-charbon/45">{t.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => onGoTo("produits")}
            className="mt-6 self-start rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90"
          >
            Ouvrir le catalogue
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Dernières modifications */}
        <div className="card-soft p-6">
          <h2 className="font-display text-lg">Dernières modifications</h2>
          <div className="mt-4">
            {recent.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 py-3 ${
                  i ? "border-t border-beige/60" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-charbon">{p.name}</div>
                  <div className="text-[11px] text-charbon/40">{p.slug}</div>
                </div>
                <div className="shrink-0 text-[11px] text-charbon/50">
                  {p.updated_at ? dateFr(p.updated_at) : "—"}
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-charbon/60">Catalogue vide.</p>
            )}
          </div>
        </div>

        {/* Dernières inscriptions */}
        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Dernières inscriptions</h2>
            <button
              onClick={() => onGoTo("attente")}
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold hover:underline"
            >
              Tout voir
            </button>
          </div>
          <div className="mt-4">
            {waitlist.slice(0, 6).map((w, i) => (
              <div
                key={w.id}
                className={`flex items-center justify-between gap-3 py-3 ${
                  i ? "border-t border-beige/60" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-charbon">{w.email}</div>
                  <div className="text-[11px] text-charbon/40">{w.collection}</div>
                </div>
                <div className="shrink-0 text-[11px] text-charbon/50">{dateFr(w.created_at)}</div>
              </div>
            ))}
            {waitlist.length === 0 && (
              <p className="py-6 text-center text-sm text-charbon/60">
                Aucune inscription pour l'instant.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
