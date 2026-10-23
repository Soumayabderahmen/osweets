import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { currentAdmin, signIn, signOut, type AdminIdentity } from "@/api/auth";
import { AdminApp } from "@/components/admin/AdminApp";
import "@/components/admin/admin.css";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — Ö' Sweets" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

/**
 * Porte d'entrée du back-office.
 *
 * Rien n'est rendu côté serveur (`ssr: false`) : cet écran n'a aucune raison
 * d'exister pour Google, et le catalogue complet ne doit pas voyager vers un
 * visiteur qui n'est pas connecté.
 */
function AdminPage() {
  const [verifie, setVerifie] = useState(false);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setAdmin(await currentAdmin());
      } catch {
        setAdmin(null);
      }
      setVerifie(true);
    })();
  }, []);

  if (!verifie)
    return (
      <div className="osadmin">
        <div className="empty" style={{ padding: 80 }}>
          Chargement…
        </div>
      </div>
    );

  if (!admin) return <Connexion onConnecte={setAdmin} />;

  return (
    <AdminApp
      email={admin.email}
      onSignOut={async () => {
        await signOut();
        setAdmin(null);
      }}
    />
  );
}

function Connexion({ onConnecte }: { onConnecte: (a: AdminIdentity) => void }) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [busy, setBusy] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signIn({ data: { email, password: motDePasse } });
      if (res.ok && res.admin) onConnecte(res.admin);
      else toast.error(res.error ?? "Adresse ou mot de passe incorrect.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible.");
    }
    setBusy(false);
  };

  return (
    <div className="osadmin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <div className="n display" style={{ fontSize: 32 }}>
            Ö' Sweets
          </div>
          <div className="s">Administration</div>
        </div>

        <form onSubmit={envoyer} className="card" style={{ display: "grid", gap: 12 }}>
          <label className="f">
            <span>Adresse e-mail</span>
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="f">
            <span>Mot de passe</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-dark" disabled={busy} style={{ width: "100%", padding: "12px 20px" }}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
          Un compte se crée en ligne de commande, jamais depuis une page web — personne ne peut
          s'ajouter tout seul.
        </p>
      </div>
    </div>
  );
}
