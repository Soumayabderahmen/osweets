import kaakWarka from "@/assets/p-kaak-warka.jpg";
import baklawa from "@/assets/p-baklawa.jpg";
import ghrayba from "@/assets/p-ghrayba.jpg";
import makroudh from "@/assets/p-makroudh.jpg";
import samsa from "@/assets/p-samsa.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import coffret from "@/assets/cat-coffrets.jpg";
import heroPlatter from "@/assets/hero-platter.jpg";
import catSaleImg from "@/assets/cat-sale.jpg";

export type Allergen = "gluten" | "lait" | "oeuf" | "fruits-coque" | "sesame" | "soja";
export type Category =
  | "traditionnelle"
  | "orientale"
  | "petits-fours"
  | "cake"
  | "coffret"
  | "sale"
  | "pack-fiancailles"
  | "anniversaire";

/** Façon de vendre — voir `Product.sellMode`. */
export type SellMode = "" | "kg" | "format" | "pot";

export type ProductCollection =
  "amandes" | "pistache" | "perles" | "tradition" | "ramadan" | "aid" | "fin-annee";

/** Parfum d'un produit à variantes (ex. la kounefa) — prix et photo propres. */
export interface ProductVariant {
  id: string;
  /**
   * Libellé COMPOSÉ (« Petit format · 4–6 personnes · 4 pièces ») — celui
   * qui part au panier et dans la commande. Il est fabriqué une seule fois,
   * par `rowToProduct()`, via `optionLabel()`.
   */
  label: string;
  /**
   * Nom SEUL saisi en back-office (« Petit format », « Pot individuel »),
   * conservé à côté du libellé composé. Il permet d'afficher le choix sur
   * deux niveaux — nom en titre, détails en dessous — sans avoir à
   * re-découper le libellé composé (découpage fragile) ni à le recomposer
   * (ce qui dupliquait les mentions, bug déjà rencontré).
   */
  baseLabel?: string;
  /**
   * Prix de l'option. Absent pour un palier `kg` : son prix se calcule
   * toujours depuis `Product.price` (prix au kilo) × `grams` / 1000, jamais
   * stocké — voir `kgOptionPrice()` dans `variant-label.ts`.
   */
  price?: number;
  image?: string;
  /** Ancien champ texte libre (« 4 », « 12 ») — conservé en lecture pour les fiches non migrées. */
  serves?: string;

  /** FORMAT — bornes structurées du nombre de personnes couvertes par ce format. */
  servesMin?: number | null;
  servesMax?: number | null;
  /** FORMAT — nombre de pièces de CE format (jamais le total produit). */
  pieces?: number | null;
  /** FORMAT — purement indicatif pour le tri/l'étiquette Petit/Grand. */
  formatSize?: "small" | "large";

  /** POT — poids ou contenance de ce contenant, en grammes. Appartient à l'option, jamais au produit. */
  weightG?: number | null;

  /** KG — grammage proposé pour ce palier (100, 250, 500, 1000…). */
  grams?: number;
  /** KG — estimation FACULTATIVE et non garantie du nombre de pièces pour ce grammage. */
  piecesEstimate?: number | null;
  /** KG — composition facultative d'un mélange (ex. Dattes Farcies Variées), par parfum. */
  composition?: { flavor: string; pieces: number }[];
}

export interface AssortmentCompositionItem {
  flavor: string;
  grams: number;
}

/**
 * Familles de produits — regroupent les parfums d'une même recette.
 *
 * La liste n'est plus écrite ici. Elle l'a été : trois valeurs — samsa,
 * kounefa, assida. Créer une quatrième famille depuis le back-office
 * n'aurait servi à rien : le type l'aurait refusée. Les familles vivent
 * dans la table `families` ; le code ne manipule plus qu'une clé.
 */
export type ProductFamily = string;

export interface Product {
  createdAt?: string;
  /** Identifiant stable quand le produit vient de PostgreSQL. */
  id?: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  unit?: string;
  image: string;
  shortDesc: string;
  description: string;
  composition: string[];
  ingredients: string[];
  allergens: Allergen[];
  conservation: string;
  availability?: string[];
  badge?: "bestseller" | "nouveau" | "commande" | "promo" | "limitee";
  occasions?: string[];
  inStock?: boolean;
  pieces?: number;
  themes?: string[];
  packIncludes?: string[];
  serves?: number;
  /** Collections thématiques (peut appartenir à plusieurs). */
  collections?: ProductCollection[];
  /** Champ admin — produit disponible uniquement pendant Ramadan / Aïd. */
  seasonalOnly?: boolean;
  /** Titre saisi dans « Ce que Google affiche ». Prime sur le nom. */
  seoTitle?: string;
  /** Description saisie dans « Ce que Google affiche ». Prime sur l'accroche. */
  seoDescription?: string;
  /** Famille de produit — regroupe les parfums d'une même recette. */
  family?: ProductFamily;
  /** Type structuré au sein de la famille (ex. kechda, fromage, assortiment). */
  productType?: string;
  /** Nom court du parfum au sein de la famille (ex. « Amandes »). */
  flavorLabel?: string;
  /** Répartition de référence pour 1 kg, utilisée uniquement par un assortiment. */
  assortmentComposition?: AssortmentCompositionItem[];
  /**
   * « Vous aimerez aussi » — les fiches choisies à la main au back-office.
   * Vide : la boutique propose les autres produits de la même catégorie.
   */
  recommended?: string[];
  /** Champ admin — produit publié sur la boutique (défaut : true). */
  published?: boolean;
  /** Champ admin — produit retiré du catalogue public sans être supprimé. */
  archived?: boolean;
  /** Fiche en cours de rédaction : prix et photo à renseigner en admin. */
  draft?: boolean;

  /** Parfums / variantes proposées (texte informatif). */
  flavors?: string[];
  /** Parfums vendables — une seule fiche, un prix et une photo par parfum. */
  variants?: ProductVariant[];
  /** Poids indicatif du produit ou du contenant. */
  weight?: string;
  /** Variétés incluses dans un assortiment. */
  varieties?: string[];
  /** Modes de livraison / réception. */
  deliveryMode?: string;
  /** Un assortiment peut être modifié par le client (choix des variétés). */
  customizable?: boolean;
  /** Masque le prix public — produit sur devis uniquement. */
  hidePrice?: boolean;
  /** Désactive le bouton « Ajouter au panier » (produit sur devis / événementiel). */
  noCart?: boolean;
  /** Note d'information affichée sur la fiche produit. */
  disclaimer?: string;
  /** Prix à la pièce (plateaux salés vendus aussi à la pièce). */
  pricePerPiece?: number;
  /** Quantité minimale de commande. */
  minQuantity?: string;
  /** Délai / date de préparation. */
  prepLead?: string;
  /** Produit frais : retrait atelier ou livraison locale uniquement (jamais d'expédition). */
  localOnly?: boolean;
  /** Champ admin — Expédiable (expédition nationale par transporteur). */
  shippable?: boolean;
  /** Champ admin — Livraison locale (au kilomètre depuis l'atelier). */
  localDelivery?: boolean;
  /** Champ admin — Retrait à l'atelier. */
  pickup?: boolean;
  /** Champ admin — Nécessite du froid (chaîne du froid : pas d'expédition). */
  requiresCold?: boolean;

  /**
   * Comment la cliente choisit, décidé par l'administratrice et non plus
   * deviné à partir du texte des libellés.
   *   ""       un seul prix, elle n'a rien à choisir
   *   "kg"     elle choisit la quantité (100 g, 500 g, 1 kg…)
   *   "format" elle choisit la taille (4-6 personnes, 8-12 personnes…)
   *   "pot"    elle choisit la contenance (pot 100 g, pot 250 g…)
   * Les options elles-mêmes vivent dans `variants`.
   */
  sellMode?: SellMode;

  /** Quantité en réserve. Ignorée quand `stockUnlimited` vaut true. */
  stockQty?: number;
  /** Seuil d'alerte du back-office. */
  stockAlert?: number;
  /** Produit fait à la demande : aucun compteur, il ne s'épuise jamais seul. */
  stockUnlimited?: boolean;
}

export const products: Product[] = [
  {
    slug: "cake-citron-pavot",
    name: "Cake Citron Confit & Pavot",
    category: "cake",
    price: 28,
    image: cakeCitron,
    shortDesc:
      "L'équilibre délicat de l'acidité des citrons de Menton et de la douceur du beurre AOP.",
    description:
      "Un cake exigeant : citrons de Menton confits maison, beurre AOP de Charentes, graines de pavot bleu, glaçage citron pur.",
    composition: [
      "Biscuit moelleux beurre AOP",
      "Citrons confits maison",
      "Graines de pavot",
      "Glaçage citron",
    ],
    ingredients: [
      "Beurre AOP",
      "Sucre",
      "Œufs frais",
      "Farine T55",
      "Citron confit",
      "Pavot",
      "Sel de Guérande",
    ],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "8 jours à température ambiante.",
    availability: ["mardi", "jeudi", "samedi"],
    badge: "bestseller",
    inStock: true,
  },
  {
    slug: "cake-chocolat-intense",
    name: "Cake Chocolat Noir Intense",
    category: "cake",
    price: 28,
    image: cakeChocolat,
    shortDesc: "Pure origine Pérou 70%, ganache brillante, éclats torréfiés.",
    description:
      "Pour les puristes du chocolat : couverture pure origine Pérou 70%, ganache miroir, éclats de fèves torréfiées.",
    composition: ["Biscuit chocolat noir 70%", "Ganache miroir", "Éclats de fèves"],
    ingredients: ["Chocolat 70%", "Beurre AOP", "Œufs", "Sucre muscovado", "Farine", "Cacao"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "8 jours.",
    availability: ["mardi", "jeudi", "samedi"],
    inStock: true,
  },
  {
    slug: "cake-vanille-amandes",
    name: "Cake Vanille Bourbon & Amandes",
    category: "cake",
    price: 28,
    image: cakeVanille,
    shortDesc: "Vanille de Madagascar, amandes grillées du Piémont, douceur infinie.",
    description:
      "La vanille Bourbon en majesté : 3 gousses par cake, amandes effilées du Piémont délicatement grillées.",
    composition: ["Biscuit vanille Bourbon", "Amandes grillées", "Glaçage blanc"],
    ingredients: ["Vanille Bourbon", "Amandes", "Beurre", "Œufs", "Sucre", "Farine"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque"],
    conservation: "8 jours.",
    availability: ["jeudi", "samedi"],
    inStock: true,
  },
  {
    slug: "cake-pistache-fleur-oranger",
    name: "Cake Pistache & Fleur d'Oranger",
    category: "cake",
    price: 30,
    image: cakePistache,
    shortDesc: "Pistaches d'Iran, fleur d'oranger de Tunisie — la signature.",
    description:
      "Notre signature : le mariage de la pistache d'Iran et de la fleur d'oranger tunisienne distillée. Glaçage vert pistache.",
    composition: [
      "Biscuit pistache",
      "Glaçage pistache",
      "Éclats torréfiés",
      "Sirop fleur d'oranger",
    ],
    ingredients: ["Pâte de pistache pure", "Fleur d'oranger", "Beurre", "Œufs", "Sucre", "Farine"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque"],
    conservation: "8 jours.",
    availability: ["mardi", "jeudi", "samedi"],
    badge: "nouveau",
    inStock: true,
  },
  {
    slug: "cake-noisette-piemont",
    name: "Cake Noisette du Piémont",
    category: "cake",
    price: 28,
    image: cakeNoisette,
    shortDesc: "Noisettes IGP du Piémont torréfiées, praliné maison.",
    description:
      "Noisettes IGP du Piémont torréfiées maison, praliné coulant, glaçage chocolat au lait Jivara.",
    composition: ["Biscuit noisette", "Praliné", "Glaçage chocolat lait"],
    ingredients: ["Noisettes IGP", "Beurre", "Sucre", "Œufs", "Chocolat lait", "Farine"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque"],
    conservation: "8 jours.",
    availability: ["mardi", "samedi"],
    inStock: true,
  },
  // Coffrets cadeaux
  {
    slug: "coffret-decouverte",
    name: "Coffret Découverte",
    category: "coffret",
    price: 48,
    image: coffret,
    shortDesc: "12 pièces variées dans un écrin signature Ö'Sweets.",
    description:
      "Le coffret idéal pour découvrir notre univers : 12 pâtisseries variées (kaak warka, baklawa, ghrayba, makroudh, samsa), présentées dans un écrin noir et or signature.",
    composition: ["3 kaak warka", "3 baklawa", "3 ghrayba", "3 samsa", "Écrin cadeau"],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    badge: "bestseller",
    inStock: true,
    pieces: 12,
    occasions: ["aid", "fete-des-meres", "fete-des-peres", "entreprise"],
  },
  {
    slug: "coffret-prestige",
    name: "Coffret Prestige",
    category: "coffret",
    price: 88,
    image: coffret,
    shortDesc: "24 pièces d'exception, l'écrin grand format pour les grandes occasions.",
    description:
      "L'écrin grand format : 24 pâtisseries soigneusement sélectionnées, ruban de soie, carte personnalisable.",
    composition: ["Assortiment 24 pièces signature", "Ruban soie", "Carte personnalisée"],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    inStock: true,
    pieces: 24,
    occasions: ["mariage", "fiancailles", "entreprise"],
  },
  {
    slug: "coffret-aid",
    name: "Coffret Aïd Mubarak",
    category: "coffret",
    price: 65,
    image: coffret,
    shortDesc: "Plateau de fête : kaak warka, baklawa, mignardises orientales.",
    description:
      "Pour célébrer l'Aïd en famille. Plateau garni de nos icônes : kaak warka, baklawa pistache, ghrayba, makroudh, samsa — dans un écrin doré.",
    composition: ["18 pièces variées", "Écrin doré", "Carte Aïd Mubarak"],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    inStock: true,
    pieces: 18,
    occasions: ["aid"],
  },
  // Packs Fiançailles
  {
    slug: "pack-fiancailles-demande",
    name: "Pack Demande en Mariage",
    category: "pack-fiancailles",
    price: 380,
    image: weddingImg,
    shortDesc: "Plateau intime 100 pièces + gâteau cœur signature — pour 20 invités.",
    description:
      "Le pack idéal pour une demande intimiste : 100 pièces variées de nos signatures, un gâteau cœur 16cm parfum au choix, présentation en écrin doré.",
    composition: [
      "Gâteau cœur 16cm",
      "100 pièces variées (baklawa, kaak warka, samsa, makroudh)",
      "Écrin doré",
      "Carte personnalisée",
    ],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours en boîte hermétique.",
    inStock: true,
    pieces: 100,
    serves: 20,
    occasions: ["fiancailles"],
    packIncludes: [
      "Gâteau cœur 16cm (parfum au choix)",
      "100 pièces variées signature",
      "Présentation écrin doré",
      "Carte personnalisée",
    ],
  },
  {
    slug: "pack-fiancailles-celebration",
    name: "Pack Célébration",
    category: "pack-fiancailles",
    price: 780,
    image: weddingImg,
    shortDesc: "250 pièces + gâteau 24cm + bar à dattes — pour 50 invités.",
    description:
      "Pour une célébration en grand : 250 pièces de pâtisseries fines, gâteau personnalisé 24cm, bar à dattes, mise en scène incluse.",
    composition: [
      "Gâteau personnalisé 24cm",
      "250 pièces variées",
      "Bar à dattes",
      "Mise en scène",
    ],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    badge: "bestseller",
    inStock: true,
    pieces: 250,
    serves: 50,
    occasions: ["fiancailles"],
    packIncludes: [
      "Gâteau personnalisé 24cm",
      "250 pièces (baklawa, kaak warka, samsa, mignardises)",
      "Bar à dattes premium",
      "Mise en scène complète",
    ],
  },
  {
    slug: "pack-fiancailles-prestige",
    name: "Pack Prestige",
    category: "pack-fiancailles",
    price: 1450,
    image: weddingImg,
    shortDesc: "500 pièces + pièce montée 2 étages — pour 100 invités.",
    description:
      "L'écrin grandiose pour vos fiançailles : 500 pièces variées, pièce montée 2 étages, arche dorée, service et livraison inclus.",
    composition: ["Pièce montée 2 étages", "500 pièces variées", "Arche dorée", "Service complet"],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    inStock: true,
    pieces: 500,
    serves: 100,
    occasions: ["fiancailles"],
    packIncludes: [
      "Pièce montée 2 étages",
      "500 pièces variées signature",
      "Présentation arche dorée",
      "Service + livraison Île-de-France",
    ],
  },
  {
    slug: "pack-fiancailles-royal",
    name: "Pack Royal",
    category: "pack-fiancailles",
    price: 2400,
    image: weddingImg,
    shortDesc: "Buffet complet 800 pièces + pièce montée 3 étages — pour 150 invités.",
    description:
      "L'excellence pour vos fiançailles : buffet oriental complet, pièce montée 3 étages personnalisée, bar à dattes, fleurs, service complet.",
    composition: [
      "Pièce montée 3 étages",
      "800 pièces variées",
      "Bar à dattes & fruits secs",
      "Décoration florale",
    ],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    inStock: true,
    pieces: 800,
    serves: 150,
    occasions: ["fiancailles"],
    packIncludes: [
      "Pièce montée 3 étages personnalisée",
      "800 pièces (8 variétés)",
      "Bar à dattes & fruits secs",
      "Décoration florale or",
      "Service & livraison",
    ],
  },
  {
    slug: "pack-fiancailles-intime",
    name: "Pack Intime",
    category: "pack-fiancailles",
    price: 220,
    image: coffretImg,
    shortDesc: "Coffret 50 pièces + petit gâteau — pour 10 invités.",
    description:
      "Pour une demande en très petit comité : coffret écrin de 50 pièces variées et un petit gâteau signature.",
    composition: ["Petit gâteau 14cm", "50 pièces variées", "Écrin doré"],
    ingredients: ["Voir fiches produits"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "10 jours.",
    inStock: true,
    pieces: 50,
    serves: 10,
    occasions: ["fiancailles"],
    packIncludes: ["Petit gâteau 14cm", "50 pièces signature", "Écrin doré + carte"],
  },
  // Gâteaux anniversaire à thème (demo)
  {
    slug: "gateau-licorne",
    requiresCold: true,
    name: "Gâteau Licorne Pastel",
    category: "anniversaire",
    price: 75,
    image: cakePistache,
    shortDesc: "Gâteau crème pastel, corne dorée, décor licorne — 20cm / 8 parts.",
    description:
      "Un gâteau féerique pour les amoureuses des licornes : génoise vanille ou pistache, crème pastel, corne dorée et meringues colorées.",
    composition: [
      "Génoise vanille ou pistache",
      "Crème pastel",
      "Décor licorne sucre",
      "Meringues",
    ],
    ingredients: ["Farine", "Beurre AOP", "Œufs", "Sucre", "Vanille", "Colorants naturels"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 8,
    themes: ["licorne", "enfant-fille"],
    occasions: ["anniversaire"],
  },
  {
    slug: "gateau-reine-des-neiges",
    requiresCold: true,
    name: "Gâteau Reine des Neiges",
    category: "anniversaire",
    price: 80,
    image: cakeVanille,
    shortDesc: "Gâteau Elsa, glaçage bleu cristal, paillettes argentées — 20cm.",
    description:
      "Le gâteau préféré des petites princesses Frozen : génoise vanille bourbon, glaçage bleu cristal, paillettes argentées, figurines en sucre.",
    composition: [
      "Génoise vanille",
      "Glaçage bleu cristal",
      "Paillettes argentées",
      "Décor Reine des Neiges",
    ],
    ingredients: ["Farine", "Beurre AOP", "Œufs", "Sucre", "Vanille Bourbon"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 8,
    themes: ["reine-des-neiges", "enfant-fille", "princesse"],
    occasions: ["anniversaire"],
  },
  {
    slug: "gateau-spider-man",
    requiresCold: true,
    name: "Gâteau Spider-Man",
    category: "anniversaire",
    price: 75,
    image: cakeChocolat,
    shortDesc: "Gâteau chocolat, toile d'araignée rouge & noir — 20cm.",
    description:
      "Pour les héros en herbe : génoise chocolat intense, glaçage rouge & noir, motif toile d'araignée et figurine Spider-Man.",
    composition: ["Génoise chocolat", "Glaçage rouge & noir", "Décor Spider-Man"],
    ingredients: ["Chocolat 70%", "Beurre AOP", "Œufs", "Sucre", "Farine"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 8,
    themes: ["spider-man", "super-heros", "enfant-garcon"],
    occasions: ["anniversaire"],
  },
  {
    slug: "gateau-football",
    requiresCold: true,
    name: "Gâteau Football",
    category: "anniversaire",
    price: 70,
    image: cakeNoisette,
    shortDesc: "Terrain de foot vert, ballon sucre, décor club au choix — 24cm.",
    description:
      "Pour les fans de foot : génoise au choix, glaçage terrain vert, ballon en sucre et possibilité de personnaliser aux couleurs du club.",
    composition: [
      "Génoise noisette ou chocolat",
      "Glaçage terrain vert",
      "Ballon sucre",
      "Décor club",
    ],
    ingredients: ["Noisettes IGP", "Beurre", "Œufs", "Sucre", "Farine"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 12,
    themes: ["football", "enfant-garcon", "ado"],
    occasions: ["anniversaire"],
  },
  {
    slug: "gateau-princesse",
    requiresCold: true,
    name: "Gâteau Princesse",
    category: "anniversaire",
    price: 85,
    image: cakeCitron,
    shortDesc: "Robe de princesse en crème, couronne dorée — 24cm.",
    description:
      "Un gâteau royal pour les petites princesses : génoise vanille ou fraise, crème en forme de robe, couronne dorée comestible.",
    composition: ["Génoise vanille/fraise", "Crème robe princesse", "Couronne dorée comestible"],
    ingredients: ["Farine", "Beurre", "Œufs", "Sucre", "Vanille"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 12,
    themes: ["princesse", "enfant-fille"],
    occasions: ["anniversaire"],
  },
  {
    slug: "gateau-floral-adulte",
    requiresCold: true,
    name: "Gâteau Floral Élégant",
    category: "anniversaire",
    price: 95,
    image: mignardises,
    shortDesc: "Crème ivoire, fleurs comestibles, finition or — 24cm.",
    description:
      "L'élégance pour un anniversaire adulte : génoise pistache ou citron, crème ivoire, fleurs fraîches comestibles et touche or.",
    composition: [
      "Génoise pistache ou citron",
      "Crème ivoire",
      "Fleurs comestibles",
      "Or alimentaire",
    ],
    ingredients: ["Pistache", "Beurre AOP", "Œufs", "Sucre", "Farine"],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque"],
    conservation: "48h au frais.",
    inStock: true,
    pieces: 12,
    themes: ["fleurs", "adulte", "anniversaire-mariage"],
    occasions: ["anniversaire"],
  },
  // ============ ÉPICERIE SALÉE ============
  {
    slug: "tapenade-noire",
    name: "Tapenade Noire",
    category: "sale",
    price: 8.5,
    image: mignardises,
    shortDesc: "Olives noires de Kalamata, câpres, anchois, huile d'olive extra vierge.",
    description:
      "Notre tapenade noire est préparée à la main avec des olives Kalamata AOP, des câpres du Salento et une huile d'olive extra vierge tunisienne. Idéale à tartiner ou en accompagnement de vos apéritifs.",
    composition: ["Olives Kalamata", "Câpres", "Anchois", "Huile d'olive extra vierge", "Ail"],
    ingredients: ["Olives noires", "Câpres", "Anchois", "Huile d'olive", "Ail", "Poivre"],
    allergens: [],
    conservation: "Au frais après ouverture, 15 jours.",
    inStock: true,
    themes: ["tartinables"],
    badge: "nouveau",
  },
  {
    slug: "houmous-signature",
    name: "Houmous Signature",
    category: "sale",
    price: 7.5,
    image: mignardises,
    shortDesc: "Pois chiches, tahini de sésame torréfié, citron, huile d'olive.",
    description:
      "Un houmous crémeux façon Beyrouth : pois chiches cuisinés lentement, tahini de sésame torréfié, jus de citron frais et filet d'huile d'olive.",
    composition: ["Pois chiches", "Tahini", "Citron", "Huile d'olive", "Ail"],
    ingredients: ["Pois chiches", "Sésame", "Citron", "Huile d'olive", "Ail", "Cumin"],
    allergens: ["sesame"],
    conservation: "Au frais, à consommer sous 10 jours.",
    inStock: true,
    themes: ["tartinables"],
  },
  {
    slug: "caviar-aubergine",
    name: "Caviar d'Aubergine Fumé",
    category: "sale",
    price: 9,
    image: mignardises,
    shortDesc: "Aubergines grillées au feu de bois, tahini, ail confit.",
    description:
      "Aubergines fumées au feu de bois, écrasées à la fourchette avec tahini, ail confit et huile d'olive. Un classique du Levant.",
    composition: ["Aubergines fumées", "Tahini", "Ail confit", "Huile d'olive", "Citron"],
    ingredients: ["Aubergine", "Sésame", "Ail", "Huile d'olive", "Citron"],
    allergens: ["sesame"],
    conservation: "Au frais, 10 jours après ouverture.",
    inStock: true,
    themes: ["tartinables"],
  },
  {
    slug: "huile-olive-extra-vierge",
    name: "Huile d'Olive Extra Vierge · 500ml",
    category: "sale",
    price: 18,
    image: mignardises,
    shortDesc: "Chemlali & Chetoui, première pression à froid, région du Cap Bon.",
    description:
      "Notre huile d'olive extra vierge est issue d'un assemblage exclusif de variétés Chemlali et Chetoui, pressées à froid dans notre moulin partenaire du Cap Bon tunisien.",
    composition: ["Huile d'olive extra vierge première pression à froid"],
    ingredients: ["Huile d'olive extra vierge"],
    allergens: [],
    conservation: "À l'abri de la lumière, 18 mois.",
    inStock: true,
    themes: ["huiles"],
    badge: "bestseller",
  },
  {
    slug: "huile-truffe-blanche",
    name: "Huile Parfumée à la Truffe Blanche · 100ml",
    category: "sale",
    price: 24,
    image: mignardises,
    shortDesc: "Huile d'olive infusée d'arômes de truffe blanche du Piémont.",
    description:
      "Une huile de finition d'exception : quelques gouttes sur des pâtes fraîches, un risotto ou un œuf mollet.",
    composition: ["Huile d'olive extra vierge", "Arôme naturel de truffe blanche"],
    ingredients: ["Huile d'olive", "Arôme truffe blanche"],
    allergens: [],
    conservation: "12 mois à l'abri de la lumière.",
    inStock: true,
    themes: ["huiles"],
  },
  {
    slug: "vinaigre-balsamique-modene",
    name: "Vinaigre Balsamique de Modène · 250ml",
    category: "sale",
    price: 14,
    image: mignardises,
    shortDesc: "Vieilli 8 ans en fûts de chêne, texture sirupeuse et notes boisées.",
    description:
      "Un balsamique IGP de Modène, vieilli 8 ans, à la texture dense et aux notes boisées. Parfait sur une burrata ou en réduction.",
    composition: ["Moût de raisin cuit", "Vinaigre de vin"],
    ingredients: ["Moût de raisin", "Vinaigre de vin", "Contient des sulfites"],
    allergens: [],
    conservation: "36 mois.",
    inStock: true,
    themes: ["vinaigres", "huiles"],
  },
  {
    slug: "ras-el-hanout",
    name: "Ras el Hanout · Mélange Royal",
    category: "sale",
    price: 9.5,
    image: mignardises,
    shortDesc: "27 épices assemblées à la main : cardamome, rose, cannelle, gingembre…",
    description:
      "Notre ras el hanout maison assemble 27 épices dont la rose de Damas, la cardamome verte et la cannelle de Ceylan. Idéal pour tajines, couscous et marinades.",
    composition: ["27 épices sélectionnées", "Assemblage artisanal"],
    ingredients: ["Cardamome", "Cannelle", "Rose", "Gingembre", "Cumin", "Coriandre"],
    allergens: [],
    conservation: "24 mois à l'abri de l'humidité.",
    inStock: true,
    themes: ["epices"],
    badge: "bestseller",
  },
  {
    slug: "harissa-artisanale",
    name: "Harissa Artisanale · 200g",
    category: "sale",
    price: 7,
    image: mignardises,
    shortDesc: "Piments rouges séchés au soleil, ail, coriandre, huile d'olive.",
    description:
      "La véritable harissa tunisienne, préparée avec des piments séchés au soleil du Cap Bon, ail frais, graines de coriandre et huile d'olive.",
    composition: ["Piments rouges", "Ail", "Coriandre", "Cumin", "Huile d'olive", "Sel"],
    ingredients: ["Piment", "Ail", "Coriandre", "Cumin", "Huile d'olive", "Sel"],
    allergens: [],
    conservation: "6 mois au frais après ouverture.",
    inStock: true,
    themes: ["epices"],
  },
  {
    slug: "dukkah-noisettes",
    name: "Dukkah aux Noisettes · 150g",
    category: "sale",
    price: 8,
    image: mignardises,
    shortDesc: "Mélange égyptien : noisettes torréfiées, sésame, coriandre, cumin.",
    description:
      "Un condiment croustillant à saupoudrer sur du pain trempé dans l'huile d'olive, sur des légumes rôtis ou une salade.",
    composition: ["Noisettes torréfiées", "Sésame doré", "Coriandre", "Cumin", "Sel"],
    ingredients: ["Noisettes", "Sésame", "Coriandre", "Cumin", "Sel"],
    allergens: ["fruits-coque", "sesame"],
    conservation: "6 mois à l'abri de l'humidité.",
    inStock: true,
    themes: ["epices"],
  },
  {
    slug: "olives-kalamata",
    name: "Olives Kalamata AOP · 250g",
    category: "sale",
    price: 9,
    image: mignardises,
    shortDesc: "Olives noires charnues du Péloponnèse, marinées à l'huile d'olive.",
    description:
      "Grosses olives Kalamata AOP du Péloponnèse, dénoyautées à la main et marinées dans notre huile d'olive avec origan frais.",
    composition: ["Olives Kalamata AOP", "Huile d'olive", "Origan"],
    ingredients: ["Olives", "Huile d'olive", "Origan", "Sel"],
    allergens: [],
    conservation: "Au frais, 3 semaines après ouverture.",
    inStock: true,
    themes: ["antipasti"],
  },
  {
    slug: "tomates-sechees",
    name: "Tomates Séchées à l'Huile · 280g",
    category: "sale",
    price: 11,
    image: mignardises,
    shortDesc: "Tomates italiennes séchées au soleil, huile d'olive et herbes.",
    description:
      "Tomates San Marzano séchées lentement au soleil, marinées dans notre huile d'olive avec basilic, ail et origan.",
    composition: ["Tomates séchées", "Huile d'olive", "Basilic", "Ail", "Origan"],
    ingredients: ["Tomates", "Huile d'olive", "Herbes", "Sel"],
    allergens: [],
    conservation: "Au frais après ouverture.",
    inStock: true,
    themes: ["antipasti"],
  },
  {
    slug: "capres-lilliput",
    name: "Câpres Lilliput au Sel · 100g",
    category: "sale",
    price: 8,
    image: mignardises,
    shortDesc: "Les plus petites et les plus parfumées, salées au sel marin.",
    description:
      "Nos câpres Lilliput du Salento sont récoltées à la main et conservées au sel marin, préservant tout leur arôme floral.",
    composition: ["Câpres au sel marin"],
    ingredients: ["Câpres", "Sel marin"],
    allergens: [],
    conservation: "24 mois à température ambiante.",
    inStock: true,
    themes: ["antipasti"],
  },
  // ============ COLLECTIONS TUNISIENNES — TRADITION / RAMADAN / AÏD ============
  // ---- Fiches créées pour compléter la collection Ramadan (prix & photos à renseigner en admin) ----
  // ============ SALÉ — PLATEAUX & FORMATS INDIVIDUELS ============
  {
    slug: "plateau-sale-traditionnel",
    name: "Plateau Salé Traditionnel",
    category: "sale",
    price: 78,
    pricePerPiece: 1.3,
    image: heroPlatter,
    shortDesc:
      "Briks, samboussek, fricassés et mini-tajines — le salé tunisien de nos grand-mères.",
    description:
      "Notre plateau salé traditionnel réunit les incontournables de la table tunisienne : briks à l'œuf et au thon, samboussek à la viande, mini-fricassés, feuilletés au fromage et bouchées de tajine. Façonné le matin même de votre réception.",
    composition: [
      "Briks au thon & câpres",
      "Samboussek viande épicée",
      "Mini-fricassés tunisiens",
      "Feuilletés au fromage",
      "Bouchées de tajine malsouka",
    ],
    ingredients: [
      "Farine de blé",
      "Thon",
      "Viande de bœuf",
      "Fromage",
      "Œufs",
      "Pomme de terre",
      "Épices",
      "Huile d'olive",
    ],
    allergens: ["gluten", "lait", "oeuf"],
    conservation:
      "À consommer le jour même. Se conserve 24 h au réfrigérateur, à réchauffer 8 min au four à 160 °C.",
    inStock: true,
    pieces: 60,
    serves: 15,
    minQuantity: "1 plateau (60 pièces)",
    prepLead: "Préparé le jour de la réception — commande à passer 72 h à l'avance.",
    deliveryMode:
      "Retrait à l'atelier ou livraison locale (frais kilométriques). Pas d'expédition nationale.",
    localOnly: true,
    themes: ["plateau-traditionnel", "sale-mariage", "sale-fiancailles"],
    occasions: ["mariage", "fiancailles"],
    badge: "bestseller",
  },
  {
    slug: "plateau-sale-prestige",
    name: "Plateau Salé Prestige",
    category: "sale",
    price: 145,
    pricePerPiece: 2.4,
    image: catSaleImg,
    shortDesc: "Bouchées gastronomiques : saumon fumé, foie gras, crevettes, truffe.",
    description:
      "Une sélection haut de gamme pour vos réceptions les plus soignées : blinis au saumon fumé, éclairs salés au foie gras, bouchées de crevettes marinées, mini-navettes truffées et verrines fraîcheur. Dressage doré et présentation signature.",
    composition: [
      "Blinis saumon fumé & aneth",
      "Éclairs salés foie gras",
      "Bouchées crevettes marinées",
      "Mini-navettes à la truffe",
      "Verrines fraîcheur du jour",
    ],
    ingredients: [
      "Farine de blé",
      "Saumon fumé",
      "Foie gras",
      "Crevettes",
      "Crème",
      "Beurre AOP",
      "Truffe",
      "Œufs",
    ],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "Produit frais — à consommer dans les 12 h, conservé entre 0 et 4 °C.",
    inStock: true,
    pieces: 60,
    serves: 15,
    minQuantity: "1 plateau (60 pièces)",
    prepLead: "Préparé le matin de l'événement — commande 5 jours à l'avance.",
    deliveryMode:
      "Retrait à l'atelier ou livraison locale (frais kilométriques). Pas d'expédition nationale.",
    localOnly: true,
    themes: ["plateau-prestige", "sale-mariage", "sale-fiancailles"],
    occasions: ["mariage", "fiancailles", "entreprise"],
    badge: "nouveau",
  },
  {
    slug: "plateau-sale-assorti",
    name: "Plateau Assorti Sucré-Salé",
    category: "sale",
    price: 110,
    pricePerPiece: 1.85,
    image: mignardises,
    shortDesc: "Le meilleur des deux mondes : 60 pièces salées et sucrées assorties.",
    description:
      "Un plateau d'assortiment complet mêlant nos bouchées salées signature et nos mignardises sucrées. Composition modifiable : indiquez votre répartition souhaitée entre salé et sucré à la commande.",
    composition: [
      "30 bouchées salées (briks, samboussek, feuilletés)",
      "30 mignardises sucrées (baklawa, samsa, kaak warka mini)",
      "Répartition ajustable sur demande",
    ],
    ingredients: [
      "Farine de blé",
      "Thon",
      "Fromage",
      "Amandes",
      "Pistaches",
      "Miel",
      "Beurre AOP",
      "Œufs",
    ],
    allergens: ["gluten", "lait", "oeuf", "fruits-coque", "sesame"],
    conservation: "Partie salée à consommer sous 24 h ; partie sucrée se conserve 5 jours au sec.",
    inStock: true,
    pieces: 60,
    serves: 15,
    minQuantity: "1 plateau (60 pièces)",
    prepLead: "Préparé la veille et le matin même — commande 72 h à l'avance.",
    deliveryMode:
      "Retrait à l'atelier ou livraison locale (frais kilométriques). Pas d'expédition nationale.",
    localOnly: true,
    customizable: true,
    themes: ["plateaux-assortis", "sale-mariage", "sale-fiancailles"],
    occasions: ["mariage", "fiancailles", "entreprise"],
  },
  {
    slug: "sale-individuel-brik",
    name: "Salé Individuel · Briks & Samboussek",
    category: "sale",
    price: 1.4,
    pricePerPiece: 1.4,
    unit: "la pièce",
    image: heroPlatter,
    shortDesc: "Bouchées salées vendues à la pièce, à partir de 24 pièces.",
    description:
      "Composez votre propre assortiment salé à la pièce : briks au thon, samboussek viande, feuilletés fromage, mini-fricassés. Idéal pour compléter un buffet ou une pause gourmande.",
    composition: ["Brik thon & câpres", "Samboussek viande", "Feuilleté fromage", "Mini-fricassé"],
    ingredients: ["Farine de blé", "Thon", "Viande", "Fromage", "Œufs", "Épices"],
    allergens: ["gluten", "lait", "oeuf"],
    conservation: "À consommer le jour même, réchauffage au four recommandé.",
    inStock: true,
    serves: 6,
    minQuantity: "24 pièces minimum",
    prepLead: "Préparé le jour du retrait — commande 48 h à l'avance.",
    deliveryMode:
      "Retrait à l'atelier ou livraison locale (frais kilométriques). Pas d'expédition nationale.",
    localOnly: true,
    themes: ["sale-individuel"],
  },
  {
    slug: "verrines-salees",
    name: "Verrines Salées",
    category: "sale",
    price: 2.9,
    pricePerPiece: 2.9,
    unit: "la verrine",
    image: catSaleImg,
    shortDesc: "Verrines fraîcheur : houmous-grenade, saumon-aneth, avocat-crevette.",
    description:
      "Nos verrines salées se dégustent fraîches, dressées à la commande : houmous & grenade, saumon fumé & aneth, avocat & crevette, caviar d'aubergine & dukkah. Présentées en verrines transparentes avec cuillère dorée.",
    composition: [
      "Houmous & grenade",
      "Saumon fumé & aneth",
      "Avocat & crevette",
      "Caviar d'aubergine & dukkah",
    ],
    ingredients: [
      "Pois chiches",
      "Sésame",
      "Saumon",
      "Crevettes",
      "Avocat",
      "Aubergine",
      "Crème",
      "Citron",
    ],
    allergens: ["lait", "sesame"],
    conservation: "Produit frais — à consommer dans les 12 h, à conserver entre 0 et 4 °C.",
    inStock: true,
    serves: 4,
    minQuantity: "12 verrines minimum",
    prepLead: "Dressées le matin même — commande 72 h à l'avance.",
    deliveryMode:
      "Retrait à l'atelier ou livraison locale (frais kilométriques). Pas d'expédition nationale.",
    localOnly: true,
    themes: ["verrines-salees", "sale-individuel"],
  },

  // ---- Collection Ramadan — fiches complémentaires (prix & photos à renseigner en admin) ----
  // ---- Famille KOUNEFA — un parfum = une fiche produit (plus de sélecteur) ----
];

import coffretImg from "@/assets/cat-coffrets.jpg";
import weddingImg from "@/assets/wedding-buffet.jpg";

export const giftCategories = [
  {
    slug: "maitre-maitresse",
    label: "Maître & Maîtresse",
    icon: "🎓",
    desc: "Un remerciement élégant et délicat.",
    image: coffretImg,
  },
  {
    slug: "fete-des-meres",
    label: "Fête des Mères",
    icon: "💐",
    desc: "Un écrin pour celle qui compte le plus.",
    image: mignardises,
  },
  {
    slug: "fete-des-peres",
    label: "Fête des Pères",
    icon: "🤍",
    desc: "Une attention raffinée pour les pères gourmands.",
    image: coffretImg,
  },
  {
    slug: "ramadan",
    label: "Ramadan",
    icon: "🕌",
    desc: "Plateaux iftar, dattes et pâtisseries premium.",
    image: makroudh,
  },
  {
    slug: "aid",
    label: "Eid",
    icon: "🌙",
    desc: "Célébrez l'Aïd avec des plateaux d'exception.",
    image: baklawa,
  },
  {
    slug: "entreprise",
    label: "Cadeaux d'Entreprise",
    icon: "💼",
    desc: "Coffrets brandés pour vos clients et collaborateurs.",
    image: coffretImg,
  },
  {
    slug: "remerciement",
    label: "Cadeau de Remerciement",
    icon: "✨",
    desc: "Une attention sincère, élégamment offerte.",
    image: mignardises,
  },
  {
    slug: "naissance",
    label: "Cadeau de Naissance",
    icon: "👶",
    desc: "Douceurs pastel pour célébrer l'arrivée du bébé.",
    image: ghrayba,
  },
  {
    slug: "anniversaire",
    label: "Anniversaire",
    icon: "🎂",
    desc: "Surprenez avec un coffret personnalisé.",
    image: cakeCitron,
  },
  {
    slug: "fiancailles",
    label: "Fiançailles",
    icon: "💍",
    desc: "Sublimez votre demande avec art.",
    image: weddingImg,
  },
];

export const events = [
  {
    slug: "mariage",
    label: "Mariage",
    icon: "💍",
    desc: "Buffet oriental, pièce montée, dragées sur mesure.",
    image: weddingImg,
  },
  {
    slug: "fiancailles",
    label: "Fiançailles",
    icon: "💐",
    desc: "Plateau somptueux pour ce moment d'exception.",
    image: kaakWarka,
  },
  {
    slug: "anniversaire",
    label: "Fête d'anniversaire",
    icon: "🎂",
    desc: "Buffet & coffrets pour célébrer. (Le gâteau : voir menu Gâteaux)",
    image: cakeCitron,
  },
  {
    slug: "baby-shower",
    label: "Baby Shower",
    icon: "👶",
    desc: "Douceurs pastel, coffrets personnalisés.",
    image: mignardises,
  },
  {
    slug: "gender-reveal",
    label: "Gender Reveal",
    icon: "🎀",
    desc: "Gâteau surprise & décor pour révéler le sexe de bébé.",
    image: cakePistache,
  },
  {
    slug: "entreprise",
    label: "Événement d'Entreprise",
    icon: "🏢",
    desc: "Coffrets de luxe, possibilité de branding.",
    image: coffretImg,
  },
  {
    slug: "ramadan",
    label: "Ramadan",
    icon: "🌙",
    desc: "Plateau iftar, pâtisseries et dattes premium.",
    image: makroudh,
  },
  {
    slug: "aid",
    label: "Aïd",
    icon: "🕌",
    desc: "Plateaux d'exception pour célébrer en famille.",
    image: baklawa,
  },
];

export const allergenLabels: Record<Allergen, string> = {
  gluten: "Gluten",
  lait: "Lait",
  oeuf: "Œufs",
  "fruits-coque": "Fruits à coque",
  sesame: "Sésame",
  soja: "Soja",
};
