import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Cookie,
  LayoutDashboard,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";
import { currentAdmin, signIn, signOut, type AdminIdentity } from "@/api/auth";
import { listProductsForAdmin } from "@/api/catalog";
import { listWaitlist, type WaitlistRow } from "@/api/waitlist";
import { listCollections, type CollectionRow } from "@/api/collections";
import type { ProductRow } from "@/lib/catalog";
import { AdminShell, type AdminNavGroup } from "@/components/admin/AdminShell";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { CatalogueTab } from "@/components/admin/CatalogueTab";
import { CollectionsTab } from "@/components/admin/CollectionsTab";
import { FamillesTab } from "@/components/admin/FamillesTab";
import { WaitlistTab } from "@/components/admin/WaitlistTab";

export const Route = createFileRoute("/admin")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    vue: typeof search.vue === "string" ? search.vue : undefined,
    col: typeof search.col === "string" ? search.col : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Administration — Ö' Sweets" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const SECTIONS: Record<string, { title: string; breadcrumb: string }> = {
  tableau: { title: "Tableau de bord", breadcrumb: "Pilotage" },
  collections: { title: "Collections", breadcrumb: "Pâtisserie Tunisienne" },
  produits: { title: "Produits", breadcrumb: "Pâtisserie Tunisienne" },
  parfums: { title: "Parfums & familles", breadcrumb: "Pâtisserie Tunisienne" },
  attente: { title: "Liste d'attente", breadcrumb: "Pâtisserie Tunisienne" },
};

function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setAdmin(await currentAdmin());
    } catch {
      setAdmin(null);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signIn({ data: { email, password } });
      if (!result.ok) {
        toast.error(result.error ?? "Connexion impossible.");
        return;
      }
      setAdmin(result.admin ?? null);
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-sable text-sm text-charbon/60">
        Chargement…
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="grid min-h-screen place-items-center bg-sable px-4">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="font-display text-3xl">Ö' Sweets</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.28em] text-gold">
              Administration
            </div>
          </div>
          <form onSubmit={submit} className="card-soft mt-8 space-y-3 p-6">
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail"
              className="w-full rounded-lg border-0 bg-sable px-4 py-3 text-sm outline-none transition focus:ring-1 focus:ring-gold"
            />
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border-0 bg-sable px-4 py-3 text-sm outline-none transition focus:ring-1 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-charbon/50">
            Pas encore de compte ?
            <br />
            <code>npm run db:admin -- ton@email.fr "MotDePasse"</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminConsole
      admin={admin}
      onSignOut={async () => {
        await signOut();
        setAdmin(null);
      }}
    />
  );
}

function AdminConsole({ admin, onSignOut }: { admin: AdminIdentity; onSignOut: () => void }) {
  const { vue, col } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const section = vue && SECTIONS[vue] ? vue : "tableau";

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [products, entries, cols] = await Promise.all([
        listProductsForAdmin(),
        listWaitlist(),
        listCollections(),
      ]);
      setRows(products);
      setWaitlist(entries);
      setCollections(cols);
      setDbError(null);
    } catch (e) {
      setDbError(e instanceof Error ? e.message : "Base de données injoignable.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const go = (key: string, collection?: string) =>
    navigate({ search: { vue: key, col: collection } });

  const live = rows.filter((p) => !p.archived);
  const groups: AdminNavGroup[] = [
    {
      title: "Pilotage",
      items: [{ key: "tableau", label: "Tableau de bord", icon: LayoutDashboard }],
    },
    {
      title: "Univers",
      items: [
        {
          key: "patisserie",
          label: "Pâtisserie Tunisienne",
          icon: Cookie,
          children: [
            { key: "collections", label: "Collections", badge: collections.length },
            { key: "produits", label: "Produits", badge: live.length },
            { key: "parfums", label: "Parfums & familles" },
            { key: "attente", label: "Liste d'attente", badge: waitlist.length },
          ],
        },
      ],
    },
  ];

  return (
    <AdminShell
      groups={groups}
      active={section}
      onSelect={(key) => go(key)}
      email={admin.email}
      onSignOut={onSignOut}
      title={SECTIONS[section].title}
      breadcrumb={SECTIONS[section].breadcrumb}
      search={q}
      onSearch={section === "produits" ? setQ : undefined}
    >
      {dbError && (
        <div className="card-soft mb-6 flex gap-3 border-l-4 border-gold px-4 py-3 text-sm text-charbon/85">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div>
            <strong>La base ne répond pas.</strong> Vérifie que PostgreSQL tourne, que la connexion
            est correcte dans <code className="text-xs">.env</code>, et que les migrations sont
            appliquées (<code className="text-xs">npm run db:migrate</code>).
            <div className="mt-1 text-[11px] text-charbon/55">{dbError}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-charbon/60">Chargement du catalogue…</div>
      ) : section === "tableau" ? (
        <DashboardTab rows={rows} waitlist={waitlist} onGoTo={(key) => go(key)} />
      ) : section === "produits" ? (
        <CatalogueTab rows={rows} onReload={load} initialCollection={col} query={q} />
      ) : section === "collections" ? (
        <CollectionsTab
          collections={collections}
          rows={rows}
          onOpenCollection={(c) => go("produits", c)}
          onReload={load}
        />
      ) : section === "parfums" ? (
        <FamillesTab
          rows={rows}
          onEdit={(slug) => {
            setQ(slug);
            go("produits");
          }}
        />
      ) : (
        <WaitlistTab entries={waitlist} />
      )}
    </AdminShell>
  );
}
