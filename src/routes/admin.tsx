import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { products as baseProducts, FAMILY_LABELS, type Product } from "@/data/products";
import { mergeOverrides, fetchOverrides, type ProductOverride } from "@/lib/catalog";
import { patisserieProducts } from "@/lib/patisserie";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration catalogue — Ö' Sweets" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const COLLECTION_OPTIONS = ["amandes", "pistache", "perles", "tradition", "ramadan", "aid", "fin-annee"];

interface Draft {
  name: string;
  price: string;
  image_url: string;
  short_desc: string;
  collections: string[];
  seasonal_only: boolean;
  family: string;
  published: boolean;
  description: string;
  composition: string;
  allergens: string;
  unit: string;
  pieces: string;
  weight: string;
  variants: string;
}

const lines = (v: string) => (v.trim() ? v.split("\n").map((x) => x.trim()).filter(Boolean) : null);
const csv = (v: string) => (v.trim() ? v.split(",").map((x) => x.trim()).filter(Boolean) : null);

function toDraft(p: Product): Draft {
  return {
    name: p.name,
    price: String(p.price ?? 0),
    image_url: p.image ?? "",
    short_desc: p.shortDesc ?? "",
    collections: (p.collections ?? []) as string[],
    seasonal_only: !!p.seasonalOnly,
    family: p.family ?? "",
    published: p.published !== false,
    description: p.description ?? "",
    composition: (p.composition ?? []).join("\n"),
    allergens: (p.allergens ?? []).join(", "),
    unit: p.unit ?? "",
    pieces: p.pieces ? String(p.pieces) : "",
    weight: p.weight ?? "",
    variants: p.variants?.length ? JSON.stringify(p.variants, null, 2) : "",
  };
}

function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshAuth = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;
    setSession(!!user);
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    } else {
      setIsAdmin(false);
    }
    setChecking(false);
  };

  useEffect(() => {
    void refreshAuth();
  }, []);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    setChecking(true);
    await refreshAuth();
  };

  if (checking) {
    return <div className="container-os section-y text-center text-sm text-charbon/60">Chargement…</div>;
  }

  if (!session) {
    return (
      <div className="container-os section-y max-w-md">
        <div className="eyebrow text-center">Espace privé</div>
        <h1 className="mt-3 text-center font-display text-3xl">Administration</h1>
        <form onSubmit={signIn} className="mt-8 space-y-3 border border-border bg-sable p-6">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-border bg-white px-4 py-3"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full border border-border bg-white px-4 py-3"
          />
          <button type="submit" className="btn btn-gold w-full justify-center">Se connecter</button>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-os section-y max-w-lg text-center">
        <h1 className="font-display text-3xl">Accès réservé</h1>
        <p className="mt-4 text-sm text-charbon/70">
          Votre compte n'a pas le rôle administrateur.
        </p>
        <button
          onClick={async () => { await supabase.auth.signOut(); await refreshAuth(); }}
          className="btn btn-ghost mt-6"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return <AdminConsole onSignOut={async () => { await supabase.auth.signOut(); await refreshAuth(); }} />;
}

function AdminConsole({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<"catalogue" | "waitlist">("catalogue");
  const [overrides, setOverrides] = useState<ProductOverride[]>([]);
  const [waitlist, setWaitlist] = useState<{ id: string; email: string; collection: string; created_at: string }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await fetchOverrides();
      setOverrides(list);
    } catch {
      toast.error("Impossible de charger les ajustements.");
    }
    const { data } = await supabase
      .from("patisserie_waitlist")
      .select("id,email,collection,created_at")
      .order("created_at", { ascending: false });
    setWaitlist(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const merged = useMemo(
    () => patisserieProducts(mergeOverrides(baseProducts, overrides).filter(() => true)),
    [overrides],
  );
  // On affiche aussi les produits dépubliés (patisserieProducts filtre les publiés).
  const rows = useMemo(() => {
    const published = new Set(merged.map((p) => p.slug));
    const all = mergeOverrides(baseProducts, overrides);
    return all.filter((p) => published.has(p.slug) || p.published === false);
  }, [merged, overrides]);

  const draftFor = (p: Product) => drafts[p.slug] ?? toDraft(p);
  const patch = (slug: string, p: Product, next: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [slug]: { ...draftFor(p), ...next } }));

  const save = async (p: Product) => {
    const d = draftFor(p);
    let parsedVariants: import("@/integrations/supabase/types").Json = null;
    if (d.variants.trim()) {
      try {
        parsedVariants = JSON.parse(d.variants);
      } catch {
        toast.error("Parfums : JSON invalide.");
        return;
      }
    }
    setSaving(p.slug);
    const { error } = await supabase.from("product_overrides").upsert(
      {
        slug: p.slug,
        name: d.name || null,
        price: d.price === "" ? null : Number(d.price),
        image_url: d.image_url || null,
        short_desc: d.short_desc || null,
        collections: d.collections,
        seasonal_only: d.seasonal_only,
        family: d.family || null,
        published: d.published,
        description: d.description || null,
        composition: lines(d.composition),
        allergens: csv(d.allergens),
        unit: d.unit || null,
        pieces: d.pieces === "" ? null : Number(d.pieces),
        weight: d.weight || null,
        variants: parsedVariants,
      },
      { onConflict: "slug" },
    );
    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`« ${d.name} » enregistré.`);
    setDrafts((x) => {
      const copy = { ...x };
      delete copy[p.slug];
      return copy;
    });
    void load();
  };

  return (
    <div className="container-os section-y">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Pâtisserie Tunisienne</div>
          <h1 className="mt-2 font-display text-3xl">Administration du catalogue</h1>
        </div>
        <button onClick={onSignOut} className="btn btn-ghost">Se déconnecter</button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        {(["catalogue", "waitlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.22em] ${
              tab === t ? "border-b-2 border-gold text-gold" : "text-charbon/60 hover:text-gold"
            }`}
          >
            {t === "catalogue" ? "Produits" : `Liste d'attente (${waitlist.length})`}
          </button>
        ))}
      </div>

      {tab === "catalogue" ? (
        <div className="mt-8 space-y-4">
          {rows.map((p) => {
            const d = draftFor(p);
            const dirty = !!drafts[p.slug];
            return (
              <div key={p.slug} className="border border-border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-display text-lg">{p.name}</div>
                  <code className="text-[11px] text-charbon/50">{p.slug}</code>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Nom
                    <input
                      value={d.name}
                      onChange={(e) => patch(p.slug, p, { name: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Prix (€)
                    <input
                      type="number"
                      step="0.01"
                      value={d.price}
                      onChange={(e) => patch(p.slug, p, { price: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60 md:col-span-2">
                    Image (URL)
                    <input
                      value={d.image_url}
                      onChange={(e) => patch(p.slug, p, { image_url: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60 md:col-span-2">
                    Description courte
                    <textarea
                      rows={2}
                      value={d.short_desc}
                      onChange={(e) => patch(p.slug, p, { short_desc: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60 md:col-span-2">
                    Description longue
                    <textarea
                      rows={3}
                      value={d.description}
                      onChange={(e) => patch(p.slug, p, { description: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Composition (une ligne par ingrédient)
                    <textarea
                      rows={3}
                      value={d.composition}
                      onChange={(e) => patch(p.slug, p, { composition: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Allergènes (séparés par des virgules)
                    <input
                      value={d.allergens}
                      onChange={(e) => patch(p.slug, p, { allergens: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Unité de vente
                    <input
                      value={d.unit}
                      onChange={(e) => patch(p.slug, p, { unit: e.target.value })}
                      placeholder="/ 500 g"
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Nombre de pièces
                    <input
                      type="number"
                      value={d.pieces}
                      onChange={(e) => patch(p.slug, p, { pieces: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Poids
                    <input
                      value={d.weight}
                      onChange={(e) => patch(p.slug, p, { weight: e.target.value })}
                      placeholder="500 g"
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60 md:col-span-2">
                    Parfums (JSON : id, label, price, image)
                    <textarea
                      rows={4}
                      value={d.variants}
                      onChange={(e) => patch(p.slug, p, { variants: e.target.value })}
                      placeholder='[{"id":"pistache","label":"Pistache","price":24}]'
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 font-mono text-xs normal-case tracking-normal text-charbon"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Famille de parfums
                    <select
                      value={d.family}
                      onChange={(e) => patch(p.slug, p, { family: e.target.value })}
                      className="mt-1 w-full border border-border bg-sable px-3 py-2 text-sm normal-case tracking-normal text-charbon"
                    >
                      <option value="">—</option>
                      {Object.entries(FAMILY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="text-xs uppercase tracking-[0.18em] text-charbon/60">
                    Collections
                    <div className="mt-2 flex flex-wrap gap-3 normal-case tracking-normal">
                      {COLLECTION_OPTIONS.map((c) => (
                        <label key={c} className="flex items-center gap-1.5 text-sm text-charbon/80">
                          <input
                            type="checkbox"
                            checked={d.collections.includes(c)}
                            onChange={(e) =>
                              patch(p.slug, p, {
                                collections: e.target.checked
                                  ? [...d.collections, c]
                                  : d.collections.filter((x) => x !== c),
                              })
                            }
                            className="accent-[var(--gold)]"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-sm text-charbon/80">
                    <input
                      type="checkbox"
                      checked={d.seasonal_only}
                      onChange={(e) => patch(p.slug, p, { seasonal_only: e.target.checked })}
                      className="accent-[var(--gold)]"
                    />
                    Édition saisonnière
                  </label>
                  <label className="flex items-center gap-2 text-sm text-charbon/80">
                    <input
                      type="checkbox"
                      checked={d.published}
                      onChange={(e) => patch(p.slug, p, { published: e.target.checked })}
                      className="accent-[var(--gold)]"
                    />
                    Publié en boutique
                  </label>
                  <button
                    onClick={() => save(p)}
                    disabled={!dirty || saving === p.slug}
                    className={`btn btn-gold ml-auto ${!dirty ? "opacity-40" : ""}`}
                  >
                    {saving === p.slug ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sable text-left text-[11px] uppercase tracking-[0.18em] text-charbon/60">
              <tr>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-4 py-3">{w.email}</td>
                  <td className="px-4 py-3">{w.collection}</td>
                  <td className="px-4 py-3 text-charbon/60">
                    {new Date(w.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-charbon/60">
                    Aucune inscription pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
