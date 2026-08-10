import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { getReferralCode, getReferralStats, buildShareUrl } from "@/lib/referral";

export const Route = createFileRoute("/mon-compte")({
  head: () => ({ meta: [{ title: "Mon Compte — Ö' Sweets" }] }),
  component: Page,
});

function Page() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("OSW-XXXX");
  const [stats, setStats] = useState({ invited: 0, earned: 0 });
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(getReferralCode());
    setStats(getReferralStats());
    setUrl(buildShareUrl(getReferralCode()));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="container-os section-y max-w-3xl">
      <div className="text-center">
        <div className="eyebrow">Espace client</div>
        <h1 className="font-display text-3xl md:text-4xl mt-3">{mode === "login" ? "Connexion" : "Créer un compte"}</h1>
      </div>
      <p className="mt-6 text-center text-sm text-charbon/60">
        💡 L'authentification sera activée à la prochaine étape via Lovable Cloud. Pour l'instant, le panier et les favoris sont sauvegardés localement dans votre navigateur.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); setMsg("Espace client bientôt disponible."); }} className="mt-8 bg-sable p-6 space-y-3 max-w-md mx-auto">
        <input required type="email" placeholder="Email" className="w-full bg-white border border-border px-4 py-3" />
        <input required type="password" placeholder="Mot de passe" className="w-full bg-white border border-border px-4 py-3" />
        <button type="submit" className="btn btn-gold w-full justify-center">{mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        {msg && <p className="text-center text-sm text-gold">{msg}</p>}
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="block w-full text-center text-xs uppercase tracking-wider text-charbon/60 hover:text-gold">
          {mode === "login" ? "Pas encore de compte ? Créer" : "Déjà un compte ? Se connecter"}
        </button>
      </form>

      {/* Programme de fidélité */}
      <section className="mt-16 border border-border bg-white p-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl">Mon programme de fidélité</h2>
        </div>
        <p className="text-sm text-charbon/70">
          Partagez votre code, gagnez 10% à chaque commande validée d'un filleul.
        </p>

        <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-charbon/55 mb-2">Mon code</div>
            <div className="inline-flex items-center gap-3 border border-gold px-6 py-3 font-price text-2xl tracking-[0.18em] text-gold">
              {code}
            </div>
          </div>
          <button onClick={copy} className="btn btn-gold">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm">
          <div className="border border-border p-4 text-center">
            <div className="text-2xl font-price text-gold">{stats.invited}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-charbon/60 mt-1">Filleuls</div>
          </div>
          <div className="border border-border p-4 text-center">
            <div className="text-2xl font-price text-gold">{stats.earned}€</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-charbon/60 mt-1">Gains</div>
          </div>
        </div>

        <Link to="/parrainage" className="inline-block mt-6 text-xs uppercase tracking-[0.22em] text-gold hover:underline">
          Voir le programme complet →
        </Link>
      </section>

      <Link to="/" className="block text-center mt-10 text-xs uppercase tracking-wider text-charbon/60 hover:text-gold">← Accueil</Link>
    </div>
  );
}
