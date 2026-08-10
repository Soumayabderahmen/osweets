import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sur-mesure")({
  head: () => ({
    meta: [
      { title: "Commande sur mesure — Ö' Sweets" },
      {
        name: "description",
        content:
          "Choisissez le type d'événement pour accéder au devis dédié : mariage, fiançailles, anniversaire, entreprise, Ramadan, Aïd, baby shower, gender reveal.",
      },
    ],
  }),
  component: Page,
});

const OPTIONS: { label: string; desc: string; to: string }[] = [
  { label: "Mariage", desc: "Wedding cake, plateaux, coffrets d'invités.", to: "/evenements/mariage" },
  { label: "Fiançailles", desc: "Plateaux tunisiens, gâteau signature.", to: "/evenements/fiancailles" },
  { label: "Fête d'anniversaire", desc: "Gâteau à thème et mignardises.", to: "/evenements/anniversaire" },
  { label: "Baby Shower", desc: "Douceurs pastel et présentation soignée.", to: "/evenements/baby-shower" },
  { label: "Gender Reveal", desc: "Gâteau surprise rose ou bleu.", to: "/evenements/gender-reveal" },
  { label: "Entreprise", desc: "Coffrets clients, séminaires, cocktails.", to: "/evenements/entreprise" },
  { label: "Ramadan", desc: "Assortiments traditionnels d'Iftar.", to: "/evenements/ramadan" },
  { label: "Aïd", desc: "Plateaux d'Aïd familiaux ou individuels.", to: "/evenements/aid" },
];

function Page() {
  return (
    <div className="container-os section-y max-w-5xl">
      <div className="text-center">
        <div className="eyebrow">Une demande unique</div>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Commande sur mesure</h1>
        <div className="mt-4"><span className="divider-gold" /></div>
        <p className="mt-6 text-charbon/70 max-w-2xl mx-auto">
          Sélectionnez le type d'événement — chaque univers a son devis dédié, avec calculateur de quantité,
          suggestions et formulaire adapté. Réponse sous 48h.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OPTIONS.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className="group border border-border bg-white p-6 hover:border-gold transition"
          >
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">Devis dédié</div>
            <h2 className="font-display text-2xl mt-2">{o.label}</h2>
            <p className="mt-2 text-sm text-charbon/70">{o.desc}</p>
            <span className="mt-4 inline-block text-xs uppercase tracking-[0.22em] text-charbon/70 group-hover:text-gold border-b border-gold/50 pb-0.5">
              Ouvrir →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-14 bg-sable p-8 md:p-10 text-center">
        <div className="text-[10px] uppercase tracking-[0.28em] text-gold">Autre projet ?</div>
        <h3 className="font-display text-2xl mt-2">Une envie qui ne rentre dans aucune case ?</h3>
        <p className="mt-3 text-charbon/70 max-w-xl mx-auto">
          Contactez-nous directement — nous étudions toutes les créations sur mesure.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <Link to="/contact" className="btn btn-gold">Nous contacter</Link>
          <a
            href="https://wa.me/33699466030"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ background: "#25D366", color: "white" }}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
