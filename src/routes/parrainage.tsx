import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Share2, Gift, Sparkles, Wallet, Check } from "lucide-react";
import { getReferralCode, getReferralStats, buildShareUrl } from "@/lib/referral";

export const Route = createFileRoute("/parrainage")({
  head: () => ({
    meta: [
      { title: "Programme de fidélité — Ö' Sweets" },
      { name: "description", content: "Programme de fidélité Ö' Sweets : partagez votre code, gagnez 10% sur vos prochaines commandes." },
    ],
  }),
  component: Page,
});

function Page() {
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

  const shareText = encodeURIComponent(`Découvre Ö' Sweets — pâtisserie tunisienne d'exception. Profite de -10% sur ta 1ère commande avec mon code : ${code}`);
  const waUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent("Ö' Sweets — -10% pour ta 1ère commande")}&body=${shareText}%20${encodeURIComponent(url)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div>
      {/* Hero */}
      <section className="bg-sable border-b border-border">
        <div className="container-os py-20 text-center">
          <div className="eyebrow text-gold">Programme de fidélité</div>
          <h1 className="font-display text-4xl md:text-5xl mt-4 text-charbon">Partagez Ö' Sweets, gagnez 10%</h1>
          <p className="mt-5 max-w-xl mx-auto text-charbon/70 font-light">
            Pour chaque proche qui commande grâce à votre code, vous recevez 10% sur votre prochaine commande, et votre filleul profite de 10% de bienvenue.
          </p>
        </div>
      </section>

      {/* 3 Étapes */}
      <section className="container-os section-y">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: Share2, t: "1. Partagez votre code", d: "Envoyez votre code unique par WhatsApp, mail ou sur vos réseaux." },
            { icon: Gift, t: "2. Votre filleul commande", d: "Il bénéficie automatiquement de -10% sur sa première commande." },
            { icon: Wallet, t: "3. Vous recevez 10%", d: "Une fois sa commande validée, un code -10% est crédité sur votre compte." },
          ].map((s) => (
            <div key={s.t} className="text-center p-8 border border-border hover:border-gold transition">
              <s.icon className="h-7 w-7 text-gold mx-auto mb-5" />
              <h3 className="font-display text-xl text-charbon">{s.t}</h3>
              <p className="mt-3 text-sm text-charbon/70 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mon code */}
      <section className="bg-charbon text-ivory">
        <div className="container-os section-y max-w-3xl text-center">
          <Sparkles className="h-6 w-6 text-gold mx-auto" />
          <h2 className="font-display text-3xl mt-4">Votre code fidélité</h2>
          <div className="mt-8 inline-flex items-center gap-3 border border-gold px-8 py-5 font-price text-3xl tracking-[0.18em] text-gold">
            {code}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={copy} className="btn btn-gold">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copié !" : "Copier le lien"}
            </button>
            <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-outline-gold">WhatsApp</a>
            <a href={mailUrl} className="btn btn-outline-gold">Email</a>
            <a href={fbUrl} target="_blank" rel="noreferrer" className="btn btn-outline-gold">Facebook</a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="border border-ivory/20 p-5">
              <div className="text-3xl font-price text-gold">{stats.invited}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-ivory/60 mt-1">Filleul{stats.invited > 1 ? "s" : ""}</div>
            </div>
            <div className="border border-ivory/20 p-5">
              <div className="text-3xl font-price text-gold">{stats.earned}€</div>
              <div className="text-xs uppercase tracking-[0.2em] text-ivory/60 mt-1">Gains</div>
            </div>
          </div>
          <p className="mt-8 text-xs text-ivory/55 max-w-md mx-auto">
            La récompense est créditée une fois la commande de votre filleul livrée et validée. Non cumulable avec d'autres promotions.
          </p>
          <Link to="/mon-compte" className="inline-block mt-6 text-xs uppercase tracking-[0.22em] text-gold hover:underline">
            Voir mon espace →
          </Link>
        </div>
      </section>
    </div>
  );
}
