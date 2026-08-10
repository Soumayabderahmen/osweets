import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Search, Clock, Truck, Store, Sparkles } from "lucide-react";
import hero from "@/assets/maison-hands.jpg";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Foire aux questions — Ö' Sweets" },
      { name: "description", content: "Toutes les réponses : conservation, livraison, retrait boutique, allergènes, paiement." },
    ],
  }),
  component: Page,
});

type QA = { q: string; a: string };
type Section = { id: string; title: string; icon: typeof Clock; intro?: string; qa: QA[] };

const sections: Section[] = [
  {
    id: "conservation",
    title: "Conservation & Dégustation",
    icon: Sparkles,
    intro: "Nos pâtisseries sans conservateur expriment toute leur finesse dans les premiers jours.",
    qa: [
      { q: "Combien de temps se conservent vos pâtisseries ?", a: "De 7 à 15 jours selon les produits, dans une boîte hermétique à l'abri de l'humidité et de la chaleur. Les cakes se conservent 8 jours à température ambiante." },
      { q: "Puis-je congeler vos pâtisseries ?", a: "Oui, la baklawa, le kaak warka et les samsas supportent une congélation jusqu'à 3 mois. Décongelez 4h à température ambiante avant dégustation." },
      { q: "Comment révéler tous les arômes ?", a: "Sortez les pâtisseries 15 minutes avant dégustation. Servez à température ambiante avec un thé à la menthe ou un café arabe." },
    ],
  },
  {
    id: "livraison",
    title: "Livraison & Délais",
    icon: Truck,
    intro: "Expédié avec soin, depuis notre atelier d'Évry-Courcouronnes.",
    qa: [
      { q: "Quels sont vos délais de livraison ?", a: "Toute commande passée avant 18h est expédiée le lendemain. Livraison Chronopost 24-48h en France métropolitaine." },
      { q: "Livrez-vous à l'étranger ?", a: "France métropolitaine et Belgique pour le moment. Contactez-nous pour les commandes spéciales (Suisse, Luxembourg)." },
      { q: "Combien coûte la livraison ?", a: "9,90€ en France. Offerte dès 80€ d'achat. Livraison express Île-de-France possible sous 4h (15€)." },
      { q: "Mes pâtisseries arrivent-elles intactes ?", a: "Emballage isotherme + plateau de calage sur mesure. Aucune dégradation à signaler depuis 3 ans." },
    ],
  },
  {
    id: "retrait",
    title: "Retrait en boutique",
    icon: Store,
    intro: "Récupérez votre commande à l'atelier — adresse confirmée à la validation.",
    qa: [
      { q: "Où retirer ma commande ?", a: "À notre atelier à Évry-Courcouronnes (91). L'adresse et le code d'accès vous sont envoyés à la confirmation." },
      { q: "Quels sont les horaires de retrait ?", a: "Du mardi au samedi, 10h-18h. Le dimanche sur rendez-vous pour les commandes événementielles." },
      { q: "Quel délai pour le retrait ?", a: "2h après la confirmation pour les produits en stock. 24h pour les coffrets composés. 5-7 jours pour les gâteaux sur mesure." },
    ],
  },
  {
    id: "paiement",
    title: "Paiement",
    icon: Clock,
    qa: [
      { q: "Quels moyens de paiement acceptez-vous ?", a: "Stripe (CB, Apple Pay, Google Pay) et PayPal. Paiement 100% sécurisé. Virement bancaire pour les commandes événementielles > 500€." },
      { q: "Puis-je payer en plusieurs fois ?", a: "Oui, paiement en 3 ou 4 fois sans frais via Stripe à partir de 100€." },
    ],
  },
  {
    id: "allergenes",
    title: "Allergènes & Composition",
    icon: Sparkles,
    qa: [
      { q: "Avez-vous des produits sans gluten ?", a: "Oui — la ghrayba aux amandes est naturellement sans gluten. Filtrez par allergène dans la boutique pour voir toutes nos options." },
      { q: "Puis-je connaître la composition exacte ?", a: "Chaque fiche produit détaille ingrédients et allergènes. Pour les commandes sur mesure, nous adaptons selon vos contraintes." },
    ],
  },
  {
    id: "sur-mesure",
    title: "Commandes sur mesure & Événements",
    icon: Sparkles,
    qa: [
      { q: "Quels événements gérez-vous ?", a: "Mariages, fiançailles, anniversaires, baby showers, Ramadan, Aïd, événements d'entreprise. Devis gratuit sous 24h." },
      { q: "Quel délai pour un mariage ?", a: "Réservation idéale 2 mois à l'avance. Possible jusqu'à 3 semaines avant selon disponibilité." },
      { q: "Proposez-vous une dégustation ?", a: "Oui, sur rendez-vous à l'atelier, gratuite pour toute commande > 500€ confirmée." },
    ],
  },
];

function Page() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>("conservation-0");

  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.map(s => ({
      ...s,
      qa: s.qa.filter(({ q: qq, a }) => qq.toLowerCase().includes(q) || a.toLowerCase().includes(q)),
    })).filter(s => s.qa.length > 0);
  }, [query]);

  return (
    <div className="bg-ivory">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[320px] overflow-hidden">
        <img src={hero} alt="Foire aux questions" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Nous sommes là</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Foire aux questions
          </h1>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
        </div>
      </section>

      <section className="container-os py-16 max-w-4xl">
        {/* Search */}
        <div className="relative max-w-xl mx-auto -mt-24 mb-14 z-10">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gold" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherchez une question…"
            className="w-full pl-14 pr-5 py-4 bg-white border border-gold/30 shadow-[0_10px_40px_rgba(168,145,82,0.18)] outline-none focus:border-gold"
          />
        </div>

        {/* Quick cards (3 key topics) */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {sections.slice(0, 3).map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.id} href={`#${s.id}`} className="bg-white border border-border hover:border-gold p-6 text-center transition group">
                <Icon className="h-7 w-7 text-gold mx-auto" />
                <div className="font-display text-base mt-3 group-hover:text-gold transition">{s.title}</div>
              </a>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-14">
          {filtered.map((s) => (
            <div key={s.id} id={s.id}>
              <div className="flex items-center gap-3 mb-2">
                <span className="h-px flex-1 bg-gold/30" />
                <h2 className="font-display text-2xl text-charbon">{s.title}</h2>
                <span className="h-px flex-1 bg-gold/30" />
              </div>
              {s.intro && <p className="text-center text-charbon/60 italic font-light mb-6">{s.intro}</p>}
              <div className="bg-white border border-border divide-y divide-border">
                {s.qa.map((item, qi) => {
                  const id = `${s.id}-${qi}`;
                  const isOpen = open === id;
                  return (
                    <div key={id}>
                      <button onClick={() => setOpen(isOpen ? null : id)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-sable/50 transition">
                        <span className="font-display text-base">{item.q}</span>
                        <ChevronDown className={`h-4 w-4 text-gold shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 text-charbon/75 leading-relaxed font-light">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-charbon/60">
            Aucune réponse pour « {query} ». <a href="https://wa.me/33699466030" className="text-gold underline">Contactez-nous</a>.
          </div>
        )}

        {/* Still need help */}
        <div className="mt-20 bg-gradient-to-br from-beige to-sable p-10 text-center border border-gold/20">
          <h3 className="font-display text-2xl">Une autre question ?</h3>
          <p className="mt-3 text-charbon/70 font-light">Notre équipe vous répond personnellement sous 24h.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/33699466030" target="_blank" rel="noreferrer" className="btn btn-gold">WhatsApp direct</a>
            <a href="mailto:contact@osweets.fr" className="btn btn-outline-gold">Nous écrire</a>
          </div>
        </div>
      </section>
    </div>
  );
}
