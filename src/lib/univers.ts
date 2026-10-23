import type { Category, Product } from "@/data/products";
import { isPatisserieCategory } from "./patisserie-scope.ts";

/**
 * À quel univers appartient une fiche.
 *
 * Le fil d'Ariane annonçait « Accueil / Pâtisserie Tunisienne / … » sur
 * toutes les fiches — y compris sur un cheesecake ou un plateau salé. Le
 * lien menait alors vers une boutique où le produit n'était pas.
 *
 * La catégorie du produit est déjà pilotée depuis le back-office : c'est
 * elle qui décide, plus une phrase écrite en dur dans la page. Ce tableau
 * ne dit que le nom de chaque univers et son adresse — pas ce qu'il
 * contient.
 */
export interface Univers {
  name: string;
  path: string;
}

const PAR_CATEGORIE: Record<Category, Univers> = {
  traditionnelle: { name: "Pâtisserie Tunisienne", path: "/patisserie" },
  orientale: { name: "Pâtisserie Tunisienne", path: "/patisserie" },
  "petits-fours": { name: "Pâtisserie Tunisienne", path: "/patisserie" },
  cake: { name: "Gâteaux", path: "/gateaux" },
  anniversaire: { name: "Gâteaux", path: "/gateaux" },
  coffret: { name: "Cadeaux", path: "/cadeaux" },
  sale: { name: "Épicerie salée", path: "/sale" },
  "pack-fiancailles": { name: "Packs événements", path: "/packs/fiancailles" },
};

const DEFAUT: Univers = { name: "La boutique", path: "/patisserie" };

/** L'univers d'un produit, pour le fil d'Ariane et les données structurées. */
export function universDe(p: Pick<Product, "category">): Univers {
  if (isPatisserieCategory(p.category)) return PAR_CATEGORIE.traditionnelle;
  return PAR_CATEGORIE[p.category] ?? DEFAUT;
}
