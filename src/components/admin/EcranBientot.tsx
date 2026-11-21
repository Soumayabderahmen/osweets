import { products, giftCategories } from "@/data/products";

/**
 * Les parties du site qui ne sont pas encore pilotées par l'admin.
 *
 * Elles ont leur place dans le menu, au même endroit que sur la boutique,
 * pour que l'administratrice s'y retrouve. L'écran dit franchement ce qu'il
 * en est : ce qui est en ligne aujourd'hui, et que le changer passe encore
 * par une demande, le temps que la partie arrive dans l'admin.
 */
export type PartieBientot =
  "gateaux" | "coffrets" | "cadeaux" | "evenements" | "maison" | "contact";

const PARTIES: Record<
  PartieBientot,
  { titre: string; lien: string; texte: string; liste: () => [string, string][] }
> = {
  gateaux: {
    titre: "Gâteaux",
    lien: "/gateaux",
    texte: "Cakes, cheesecakes, cupcakes, gâteaux d'anniversaire et de mariage.",
    liste: () => produitsDe("cake"),
  },
  coffrets: {
    titre: "Coffrets",
    lien: "/composer",
    texte: "Les coffrets prêts à offrir et le configurateur « Composer mon coffret ».",
    liste: () => produitsDe("coffret"),
  },
  cadeaux: {
    titre: "Cadeaux",
    lien: "/cadeaux",
    texte:
      "Les pages d'idées cadeaux. Le choix des produits affichés sur chacune se fait déjà dans la fiche produit (« Pages cadeaux »).",
    liste: () => giftCategories.map((g) => [g.label, g.desc] as [string, string]),
  },
  evenements: {
    titre: "Événements",
    lien: "/evenements",
    texte: "Les packs (fiançailles, mariage) et les pages d'événements.",
    liste: () => produitsDe("pack-fiancailles"),
  },
  maison: {
    titre: "La Maison",
    lien: "/la-maison",
    texte: "Les textes et photos de la page : histoire, savoir-faire, atelier, engagements.",
    liste: () => [],
  },
  contact: {
    titre: "Contact",
    lien: "/contact",
    texte: "Téléphone, e-mail, WhatsApp et adresse de l'atelier.",
    liste: () => [],
  },
};

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

function produitsDe(categorie: string): [string, string][] {
  return products
    .filter((p) => p.category === categorie)
    .map((p) => [p.name, euro(Number(p.price))] as [string, string]);
}

export function EcranBientot({ partie }: { partie: PartieBientot }) {
  const p = PARTIES[partie];
  const liste = p.liste();
  return (
    <>
      <div className="note">
        <b>Cette partie arrive bientôt dans l'admin.</b> Aujourd'hui, « {p.titre} » est encore
        écrite dans le site : pour changer un prix, un texte ou une photo, il faut le demander. Elle
        sera gérée ici comme la Pâtisserie Tunisienne et le Salé.
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Ce qui est en ligne aujourd'hui</h3>
        <div className="sub">{p.texte}</div>
        {liste.length > 0 && (
          <div className="bientot-liste">
            {liste.map(([nom, detail]) => (
              <div key={nom}>
                <span>{nom}</span>
                <b>{detail}</b>
              </div>
            ))}
          </div>
        )}
        <a
          className="btn-ghost"
          href={p.lien}
          target="_blank"
          rel="noreferrer"
          style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}
        >
          Voir sur le site ↗
        </a>
      </div>
    </>
  );
}
