// Packs prêts pour chaque type d'événement
export interface EventPack {
  id: string;
  name: string;
  guests: number;
  price: number;
  includes: string[];
  highlight?: boolean;
}

export const eventPacks: Record<string, EventPack[]> = {
  mariage: [
    {
      id: "intime",
      name: "Pack Intime",
      guests: 50,
      price: 850,
      includes: [
        "200 baklawas pistache",
        "100 kaak warka signature",
        "100 makrouds aux dattes",
        "Présentation buffet doré",
        "Livraison Île-de-France",
      ],
    },
    {
      id: "classique",
      name: "Pack Classique",
      guests: 100,
      price: 1650,
      highlight: true,
      includes: [
        "Pièce montée 3 étages (parfum au choix)",
        "400 baklawas pistache",
        "200 kaak warka",
        "200 mignardises assorties",
        "200 makrouds",
        "Buffet mise en scène + arche dorée",
        "Service & livraison incluse",
      ],
    },
    {
      id: "royal",
      name: "Pack Royal",
      guests: 200,
      price: 3200,
      includes: [
        "Pièce montée 5 étages personnalisée",
        "Buffet oriental complet (8 variétés, 1500 pièces)",
        "Bar à dattes & fruits secs",
        "Mise en scène complète (présentoirs dorés, fleurs)",
        "Service & livraison",
        "Dégustation préalable offerte",
      ],
    },
  ],
  fiancailles: [
    {
      id: "petit",
      name: "Pack Demande",
      guests: 20,
      price: 380,
      includes: [
        "Plateau 100 pièces variées",
        "Présentation écrin doré",
        "1 gâteau cœur 16cm signature",
      ],
    },
    {
      id: "moyen",
      name: "Pack Célébration",
      guests: 50,
      price: 780,
      highlight: true,
      includes: [
        "Plateau 250 pièces (baklawa, kaak warka, samsa, mignardises)",
        "Gâteau personnalisé 24cm",
        "Bar à dattes",
        "Mise en scène incluse",
      ],
    },
    {
      id: "grand",
      name: "Pack Prestige",
      guests: 100,
      price: 1450,
      includes: [
        "Buffet complet 500 pièces",
        "Pièce montée 2 étages",
        "Présentation arche dorée",
        "Service + livraison",
      ],
    },
  ],
  anniversaire: [
    {
      id: "petit",
      name: "Pack Goûter",
      guests: 15,
      price: 180,
      includes: ["Gâteau thématique 20cm", "50 mignardises", "Cupcakes assortis"],
    },
    {
      id: "moyen",
      name: "Pack Fête",
      guests: 30,
      price: 320,
      highlight: true,
      includes: ["Gâteau thématique 24cm", "100 mini-pâtisseries", "Bar à bonbons", "Cupcakes personnalisés"],
    },
    {
      id: "grand",
      name: "Pack Grandiose",
      guests: 60,
      price: 580,
      includes: ["Pièce montée 2 étages personnalisée", "200 mignardises", "Buffet sucré complet", "Mise en scène"],
    },
  ],
  "baby-shower": [
    {
      id: "petit",
      name: "Pack Tendresse",
      guests: 15,
      price: 220,
      includes: ["Gâteau pastel personnalisé", "Cupcakes layette", "Macarons rose/bleu"],
    },
    {
      id: "moyen",
      name: "Pack Douceur",
      guests: 30,
      price: 420,
      highlight: true,
      includes: ["Gâteau gender reveal", "100 mignardises pastel", "Bar à dragées", "Sablés bébé personnalisés"],
    },
  ],
  entreprise: [
    {
      id: "team",
      name: "Pack Équipe",
      guests: 30,
      price: 240,
      includes: ["100 mignardises individuelles", "Coffrets à offrir (12 pièces)", "Livraison au bureau"],
    },
    {
      id: "client",
      name: "Pack Clients VIP",
      guests: 50,
      price: 580,
      highlight: true,
      includes: ["50 coffrets brandés (logo doré)", "Carte personnalisée", "Livraison nationale"],
    },
    {
      id: "evenement",
      name: "Pack Séminaire",
      guests: 100,
      price: 980,
      includes: ["Buffet sucré 400 pièces", "Pause café incluse", "Mise en scène professionnelle"],
    },
  ],
  ramadan: [
    {
      id: "iftar",
      name: "Plateau Iftar",
      guests: 8,
      price: 65,
      includes: ["Dattes premium Medjool", "Zlebia & mkhareks", "Baklawa, kaak warka, samsa", "Présentation cuivre"],
    },
    {
      id: "famille",
      name: "Plateau Famille",
      guests: 15,
      price: 120,
      highlight: true,
      includes: ["Grande variété 300 pièces", "Dattes assorties", "Boissons traditionnelles"],
    },
  ],
  aid: [
    {
      id: "famille",
      name: "Coffret Aïd Famille",
      guests: 10,
      price: 85,
      includes: ["Coffret écrin doré 200 pièces", "Carte Aïd Mubarak", "5 variétés signature"],
    },
    {
      id: "grande-famille",
      name: "Plateau Aïd Grand Format",
      guests: 25,
      price: 220,
      highlight: true,
      includes: ["Plateau d'exception 500 pièces", "Toutes nos signatures", "Présentation royale"],
    },
  ],
};
