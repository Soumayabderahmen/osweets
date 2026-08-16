import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, User, Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useShop } from "@/lib/shop-store";
import {
  COOKIES_LOCATION,
  SEASONAL_COLLECTION,
  FEATURES,
  PICKUP_BY_APPOINTMENT_ENABLED,
} from "@/config/site";

// Visuals (real Ö' Sweets photos)
import imgPlateauSignature from "@/assets/plateau-or-assortiment-signature.jpg";
import imgCoffretMignardises from "@/assets/coffret-or-mignardises-chocolat.jpg";
import imgMignardisesMariage from "@/assets/mignardises-tulle-mariage.jpg";
import imgLogoBranding from "@/assets/logo-produit-branding-officiel.jpg";
import imgAidCollection from "@/assets/collection-aid-eid-mubarak.jpg";
// imgPastillesPistache retiré : plus utilisé après masquage de la carte Gâteaux placeholder.
// NOTE: pas de photo confirmée pour "sables-tartinable-fond" ni "plateau-noir-assortiment-large"
// ni "collection-aid-plateau-detail" ni "plateau-or-amandes-detail" — placeholder utilisé.

type MegaCol = { title: string; items: { to: string; label: string; highlight?: boolean }[] };
type MegaCard = { image?: string; title: string; text?: string; cta: string; to: string };
type BottomCta = { label: string; to: string };
type NavEntry = {
  label: string;
  to: string;
  cols?: MegaCol[];
  card?: MegaCard;
  extraBlock?: { title: string; text: string; ctaLabel: string; to: string; image?: string };
  bottomCta?: BottomCta;
};

// ─────────────────────────────────────────────────────────────
// Menu 1 — Pâtisserie Tunisienne
// Panneau compact 780px : 2 colonnes (filet vertical) + photo déco
// ─────────────────────────────────────────────────────────────
const patisserieCols: MegaCol[] = [
  {
    title: "Nos pâtisseries",
    items: [
      { to: "/patisserie/amandes", label: "Amandes" },
      { to: "/patisserie/pistache-machmoum-pignon", label: "Pistache, Machmoum & Pignon" },
      { to: "/patisserie/perles", label: "Perles" },
      { to: "/patisserie/tradition", label: "Tradition" },
    ],
  },
  {
    title: "Occasions",
    items: [
      { to: "/patisserie/ramadan", label: "Ramadan" },
      { to: "/patisserie/aid", label: "Aïd" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Menu 2 — Gâteaux
// COOKIES_LOCATION contrôle l'emplacement de Cookies (voir config/site.ts)
// ─────────────────────────────────────────────────────────────

const gateauxCols: MegaCol[] = [
  {
    title: "Nos gâteaux",
    items: [
      { to: "/gateaux/gateaux-de-voyage", label: "Gâteaux de voyage" },
      { to: "/gateaux/entremets", label: "Entremets" },
      { to: "/gateaux/cheesecake", label: "Cheesecakes" },
      { to: "/gateaux/tiramisu", label: "Tiramisus" },
      { to: "/gateaux/tartes", label: "Tartes" },
      { to: "/gateaux/fraisier", label: "Fraisiers" },
    ],
  },
  {
    title: "Formats individuels",
    items: [
      { to: "/gateaux/bento", label: "Bento Cakes" },
      { to: "/gateaux/fondants", label: "Fondants individuels" },
      { to: "/gateaux/verrines", label: "Verrines" },
      { to: "/gateaux/cupcakes", label: "Cupcakes" },
      ...(COOKIES_LOCATION === "gateaux" ? [{ to: "/gateaux/cookies", label: "Cookies" }] : []),
    ],
  },
  {
    title: "Célébrations & sur mesure",
    items: [
      { to: "/gateaux/anniversaire", label: "Gâteaux d'anniversaire" },
      { to: "/gateaux/wedding-cakes", label: "Wedding Cakes" },
      { to: "/packs/mariage", label: "Pack Mariage" },
      { to: "/packs/fiancailles", label: "Pack Fiançailles" },
      { to: "/packs/circoncision", label: "Pack Circoncision / Thour" },
      { to: "/gateaux/fin-annee", label: "Gâteaux de fin d'année" },
      { to: "/gateaux/configurer", label: "Configurer mon gâteau →", highlight: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Menu 3 — Coffrets (un seul configurateur derrière CTA)
// ─────────────────────────────────────────────────────────────
const coffretsCols: MegaCol[] = [
  {
    title: "Petits formats",
    items: [
      { to: "/composer?size=%226%22", label: "Coffret Dégustation · 6 pièces" },
      { to: "/composer?size=%2212%22", label: "Coffret Découverte · 12 pièces" },
      { to: "/composer", label: "Voir les petits coffrets →", highlight: true },
    ],
  },
  {
    title: "Coffrets Signature",
    items: [
      { to: "/composer?size=%2218%22", label: "Coffret Partage · 18 pièces" },
      { to: "/composer?size=%2224%22", label: "Coffret Prestige · 24 pièces" },
      { to: "/composer?size=%2236%22", label: "Coffret Réception · 36 pièces" },
      { to: "/composer?size=%2248%22", label: "Coffret Royal · 48 pièces" },
      { to: "/composer", label: "Découvrir les coffrets Signature →", highlight: true },
    ],
  },
  {
    title: "Composer mon coffret",
    items: [
      { to: "/composer", label: "Coffrets assortis" },
      { to: "/composer", label: "Choisir le format" },
      { to: "/composer", label: "Choisir les variétés" },
      ...(FEATURES.giftMessage
        ? [{ to: "/composer", label: "Ajouter un message personnalisé" }]
        : []),
      { to: "/composer", label: "Composer mon coffret →", highlight: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Menu 4 — Salé
// ─────────────────────────────────────────────────────────────
const epicerieFineCols: MegaCol[] = [
  {
    title: "Nos plateaux",
    items: [
      { to: "/sale?cat=traditionnel", label: "Salé traditionnel" },
      { to: "/sale?cat=prestige", label: "Salé prestige" },
      { to: "/sale?cat=assortis", label: "Plateaux assortis" },
    ],
  },
  {
    title: "Formats individuels",
    items: [
      { to: "/sale?cat=individuel", label: "Salé individuel" },
      { to: "/sale?cat=verrines", label: "Verrines salées" },
    ],
  },
  {
    title: "Événements",
    items: [
      { to: "/sale/mariage", label: "Salé pour mariage" },
      { to: "/sale/fiancailles", label: "Salé pour fiançailles" },
      { to: "/devis", label: "Demander un devis →" },
    ],
  },
].filter((c) => c.items.length > 0);

// ─────────────────────────────────────────────────────────────
// Menu 5 — Cadeaux
// ─────────────────────────────────────────────────────────────
const cadeauxCols: MegaCol[] = [
  {
    title: "Occasions d'offrir",
    items: [
      { to: "/cadeaux/anniversaire", label: "Cadeau d'anniversaire" },
      { to: "/cadeaux/naissance", label: "Cadeau de naissance" },
      { to: "/cadeaux/remerciement", label: "Cadeau de remerciement" },
      { to: "/cadeaux/maitre-maitresse", label: "Maître & Maîtresse" },
    ],
  },
  {
    title: "Fêtes",
    items: [
      { to: "/cadeaux/fete-des-meres", label: "Fête des Mères" },
      { to: "/cadeaux/fete-des-peres", label: "Fête des Pères" },
    ],
  },
  {
    title: "Professionnels",
    items: [
      { to: "/evenements/entreprise", label: "Cadeaux d'entreprise" },
      { to: "/composer", label: "Coffrets personnalisés" },
      {
        to: "/offre-professionnelle",
        label: "Demander une offre professionnelle →",
        highlight: true,
      },
    ],
  },
];

// Bloc saisonnier — dérivé de SEASONAL_COLLECTION (jamais automatique)
function seasonalBlock(): NavEntry["extraBlock"] | undefined {
  if (SEASONAL_COLLECTION === "ramadan") {
    return {
      title: "Collection Ramadan",
      text: "Douceurs de saison, à commander à l'avance.",
      ctaLabel: "Découvrir",
      to: "/evenements/ramadan",
    };
  }
  if (SEASONAL_COLLECTION === "aid") {
    return {
      title: "Collection Aïd",
      text: "Une sélection soignée pour célébrer l'Aïd.",
      ctaLabel: "Découvrir",
      to: "/evenements/aid",
      image: imgAidCollection,
    };
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Menu 6 — Événements
// ─────────────────────────────────────────────────────────────
const evenementsCols: MegaCol[] = [
  {
    title: "Cérémonies",
    items: [
      { to: "/evenements/mariage", label: "Mariage" },
      { to: "/evenements/fiancailles", label: "Fiançailles" },
      { to: "/evenements/anniversaire", label: "Fête d'anniversaire" },
      { to: "/gateaux/wedding-cakes", label: "Wedding Cakes" },
      { to: "/packs/mariage", label: "Pack Mariage" },
      { to: "/packs/fiancailles", label: "Pack Fiançailles" },
      { to: "/packs/circoncision", label: "Pack Circoncision / Thour" },
    ],
  },
  {
    title: "Naissance & célébrations",
    items: [
      { to: "/evenements/baby-shower", label: "Baby Shower" },
      ...(FEATURES.genderReveal
        ? [{ to: "/evenements/gender-reveal", label: "Gender Reveal" }]
        : []),
    ],
  },
  {
    title: "Inspiration & pro",
    items: [
      { to: "/evenements/presentations", label: "Nos présentations →", highlight: true },
      { to: "/evenements/entreprise", label: "Événement d'entreprise" },
      { to: "/offre-professionnelle", label: "Offre professionnelle" },
      { to: "/creation-sur-mesure", label: "Création sur mesure →", highlight: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Menu 7 — La Maison (dropdown compact, 1 colonne)
// ─────────────────────────────────────────────────────────────
const maisonCols: MegaCol[] = [
  {
    title: "La Maison",
    items: [
      { to: "/la-maison", label: "Notre histoire" },
      { to: "/la-maison#savoir-faire", label: "Notre savoir-faire" },
      { to: "/la-maison#atelier", label: "Notre atelier" },
      { to: "/la-maison#engagements", label: "Nos engagements" },
      { to: "/contact", label: "Nous contacter" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Nav assembly
// ─────────────────────────────────────────────────────────────
const NAV: NavEntry[] = [
  {
    label: "Pâtisserie Tunisienne",
    to: "/patisserie",
    cols: patisserieCols,
    card: {
      image: imgPlateauSignature,
      title: "Nos assortiments",
      text: "Une sélection de nos pâtisseries tunisiennes réunies dans un même écrin, prêtes à offrir.",
      cta: "Découvrir les assortiments",
      to: "/patisserie",
    },
  },
  {
    label: "Gâteaux",
    to: "/gateaux",
    cols: gateauxCols,
    // Carte visuelle masquée : aucune vraie photo de gâteau entier Ö' Sweets
    // n'est encore disponible. À réactiver dès qu'une photo est fournie.
    bottomCta: { label: "Voir tous les gâteaux →", to: "/gateaux" },
  },
  {
    label: "Coffrets",
    to: "/composer",
    cols: coffretsCols,
    card: {
      image: imgCoffretMignardises,
      title: "Votre coffret, votre sélection",
      text: "Choisissez vos pâtisseries préférées et composez un coffret personnalisé.",
      cta: "Je compose mon coffret",
      to: "/composer",
    },
    bottomCta: { label: "Voir tous les coffrets →", to: "/composer" },
  },
  {
    label: "Salé",
    to: "/sale",
    cols: epicerieFineCols,
    // Pas de photo produit épicerie confirmée → carte masquée.
    bottomCta: { label: "Voir toute la sélection salée →", to: "/sale" },
  },
  {
    label: "Cadeaux",
    to: "/cadeaux",
    cols: cadeauxCols,
    extraBlock: seasonalBlock(),
    bottomCta: { label: "Découvrir toutes nos idées cadeaux →", to: "/cadeaux" },
  },
  {
    label: "Événements",
    to: "/evenements",
    cols: evenementsCols,
    extraBlock: {
      title: "Vous préparez un événement ?",
      text: "Parlez-nous de votre projet et recevez une proposition personnalisée.",
      ctaLabel: "Demander un devis →",
      to: "/devis",
      image: imgMignardisesMariage,
    },
  },

  {
    label: "La Maison",
    to: "/la-maison",
    cols: maisonCols,
    card: {
      image: imgLogoBranding,
      title: "L'esprit Ö' Sweets",
      cta: "Notre histoire",
      to: "/la-maison",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Header component
// ─────────────────────────────────────────────────────────────
export function Header() {
  const { cartCount, favorites, openCart } = useShop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [pastHairline, setPastHairline] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const navItemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  /** Décalage gauche du panneau — il se centre sous son entrée de menu. */
  const [panelLeft, setPanelLeft] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setPastHairline(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hovered) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHovered(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovered]);

  // Lock body scroll + Escape to close when mobile drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const openMega = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const li = navItemRefs.current[label];
    const head = headerRef.current;
    if (li && head) {
      const item = li.getBoundingClientRect();
      const base = head.getBoundingClientRect();
      // Centré sous l'entrée, puis ramené dans la fenêtre s'il déborde.
      const width = label === "Pâtisserie Tunisienne" ? 580 : 780;
      const raw = item.left - base.left + item.width / 2 - width / 2;
      setPanelLeft(Math.min(Math.max(raw, 16), Math.max(base.width - width - 16, 16)));
    }
    setHovered(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(null), 120);
  };

  const current = NAV.find((n) => n.label === hovered);
  const isPatisserie = current?.label === "Pâtisserie Tunisienne";

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 bg-ivory/95 backdrop-blur-md transition-shadow ${
        pastHairline ? "shadow-[0_4px_24px_-12px_rgba(42,35,32,0.18)]" : "border-b border-beige/60"
      }`}
      onMouseLeave={scheduleClose}
    >
      {/* Top row : tagline left · logo center · icons right */}
      <div
        className={`container-os grid grid-cols-3 items-center transition-all ${scrolled ? "py-2.5" : "py-4"}`}
      >
        {/* Left — hamburger (mobile) + tagline (desktop) */}
        <div className="flex items-center gap-3 justify-start">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span
            className="hidden lg:inline-block text-[10px] tracking-[0.32em] uppercase text-charbon/70 font-medium"
            title={
              PICKUP_BY_APPOINTMENT_ENABLED
                ? "Retrait sur rendez-vous à Évry-Courcouronnes"
                : undefined
            }
          >
            Pâtisserie · Évry-Courcouronnes
          </span>
        </div>

        {/* Center — logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex flex-col items-center leading-none">
            <span className="font-display leading-none text-charbon text-2xl lg:text-[30px]">
              Ö' Sweets
            </span>
            <span className="hidden sm:flex items-center gap-2 mt-1.5 text-[8px] tracking-[0.4em] uppercase text-gold font-medium">
              <span className="h-px w-4 bg-gold" />
              Pâtisserie
              <span className="h-px w-4 bg-gold" />
            </span>
          </Link>
        </div>

        {/* Right — icons (ordre : compte → favoris → panier) */}
        <div className="flex items-center justify-end gap-1 md:gap-2">
          <Link
            to="/mon-compte"
            className="hidden p-2.5 text-charbon transition-colors hover:text-gold md:inline-flex"
            aria-label="Mon compte"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          {FEATURES.favorites && (
            <Link
              to="/favoris"
              className="relative p-2.5 text-charbon transition-colors hover:text-gold"
              aria-label="Favoris"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-medium text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={openCart}
            className="relative p-2.5 text-charbon transition-colors hover:text-gold"
            aria-label="Panier"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-medium text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Nav row — centered under logo */}
      <nav className="hidden border-t border-beige lg:block">
        <ul className="container-os flex items-center justify-center gap-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-charbon xl:gap-8">
          {NAV.map((item) => {
            const active = hovered === item.label;
            return (
              <li
                key={item.label}
                ref={(el) => {
                  navItemRefs.current[item.label] = el;
                }}
                onMouseEnter={() => openMega(item.label)}
              >
                <Link
                  to={item.to}
                  className={`relative inline-flex items-center gap-1 py-2 transition ${active ? "opacity-55" : "hover:opacity-55"}`}
                  activeProps={{ className: "border-b border-charbon" }}
                >
                  {item.label}
                  {item.cols && <ChevronDown className="h-3 w-3 opacity-60" />}

                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-px bg-gold origin-center transition-transform ${active ? "scale-x-100" : "scale-x-0"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mega menu overlay — carte flottante */}
      {current?.cols && (
        <div
          onMouseEnter={() => openMega(current.label)}
          onMouseLeave={scheduleClose}
          className={`hidden lg:block absolute top-full z-50 pt-3 ${
            isPatisserie ? "" : "left-1/2 -translate-x-1/2"
          }`}
          style={isPatisserie ? { left: Math.max(panelLeft ?? 0, 0) } : undefined}
        >
          <div
            className={`max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-beige bg-white shadow-[0_30px_70px_-25px_rgba(42,35,32,0.28)] ${
              isPatisserie ? "animate-fade-up" : "animate-in fade-in duration-150"
            }`}
            // Panneau compact base44 : 2 colonnes étroites (les libellés longs
            // passent à la ligne) + la carte photo de 280px.
            style={{ width: isPatisserie ? 580 : 780 }}
          >
            {isPatisserie ? (
              // ─── Panneau 780px : 2 colonnes + carte photo pleine hauteur ───
              <div className="grid grid-cols-[1fr_1fr_280px]">
                {current.cols.map((col, i) => (
                  <div key={col.title} className={`p-7 ${i > 0 ? "border-l border-beige" : ""}`}>
                    <h3 className="mb-5 text-[10px] uppercase tracking-[0.22em] text-gold">
                      {col.title}
                    </h3>
                    <ul className="space-y-0.5">
                      {col.items.map((l) => (
                        <li key={l.to + l.label}>
                          <Link
                            to={l.to}
                            onClick={() => setHovered(null)}
                            className="group flex items-center justify-between gap-2 py-2.5 normal-case tracking-normal text-charbon transition-colors hover:text-gold"
                          >
                            <span className="text-[15px]">{l.label}</span>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-charbon-soft/40 transition-colors group-hover:text-gold" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Photo décorative pleine hauteur — aucun lien */}
                {current.card?.image && (
                  <div className="relative overflow-hidden bg-sable" aria-hidden="true">
                    <img
                      src={current.card.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charbon/25 to-transparent" />
                    <div className="absolute bottom-5 left-5">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-ivory/80">
                        L'atelier
                      </p>
                      <p className="mt-1 font-display text-lg text-ivory">Fait main</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ─── Layout standard (autres menus) ───
              <>
                <div className="grid grid-cols-12 gap-0 py-2">
                  <div
                    className={`grid ${current.card || current.extraBlock ? "col-span-8" : "col-span-12"} ${({ 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as Record<number, string>)[Math.min(Math.max(current.cols.length, 1), 4)]}`}
                  >
                    {current.cols.map((col, i) => (
                      <div
                        key={col.title}
                        className={`p-7 ${i > 0 ? "border-l border-beige" : ""}`}
                      >
                        <h4 className="text-[10px] tracking-[0.22em] uppercase text-gold mb-5 font-display">
                          {col.title}
                        </h4>
                        <ul>
                          {col.items.map((l) =>
                            l.highlight ? (
                              <li key={l.to + l.label}>
                                <Link
                                  to={l.to}
                                  onClick={() => setHovered(null)}
                                  className="inline-block py-2.5 text-sm normal-case tracking-normal text-gold font-medium border-b border-gold/40 pb-0.5"
                                >
                                  {l.label}
                                </Link>
                              </li>
                            ) : (
                              <li key={l.to + l.label}>
                                <Link
                                  to={l.to}
                                  onClick={() => setHovered(null)}
                                  className="group flex items-center justify-between gap-2 py-2.5 text-[15px] normal-case tracking-normal text-charbon transition-colors hover:text-gold"
                                >
                                  {l.label}
                                  <ArrowUpRight className="h-4 w-4 shrink-0 text-charbon-soft/40 transition-colors group-hover:text-gold" />
                                </Link>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {(current.card || current.extraBlock) && (
                    <div className="col-span-4 space-y-4 p-7">
                      {current.card && (
                        <Link
                          to={current.card.to}
                          onClick={() => setHovered(null)}
                          className="block group"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sable">
                            {current.card.image ? (
                              <img
                                src={current.card.image}
                                alt={current.card.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-[11px] uppercase tracking-[0.25em] text-charbon/40 text-center px-6">
                                Photo à venir
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charbon/70 to-transparent p-4">
                              <div className="font-display text-white text-lg leading-tight">
                                {current.card.title}
                              </div>
                              {current.card.text && (
                                <p className="text-white/80 text-xs mt-1 font-light">
                                  {current.card.text}
                                </p>
                              )}
                              <span className="mt-2 inline-block text-[10px] tracking-[0.3em] uppercase text-gold-light border-b border-gold-light/60 pb-0.5">
                                {current.card.cta} →
                              </span>
                            </div>
                          </div>
                        </Link>
                      )}
                      {current.extraBlock && (
                        <div className="rounded-xl bg-beige border border-gold/30 p-5">
                          <div className="font-display text-lg leading-tight">
                            {current.extraBlock.title}
                          </div>
                          <p className="mt-1.5 text-xs text-charbon/70 font-light">
                            {current.extraBlock.text}
                          </p>
                          <Link
                            to={current.extraBlock.to}
                            onClick={() => setHovered(null)}
                            className="mt-3 inline-block text-[10px] tracking-[0.3em] uppercase text-gold border-b border-gold/60 pb-0.5"
                          >
                            {current.extraBlock.ctaLabel}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {current.bottomCta && (
                  <div className="border-t border-beige bg-sand/40">
                    <div className="px-8 py-3 flex justify-end">
                      <Link
                        to={current.bottomCta.to}
                        onClick={() => setHovered(null)}
                        className="text-[11px] tracking-[0.28em] uppercase text-gold hover:text-charbon transition"
                      >
                        {current.bottomCta.label}
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile drawer — rendered via portal to escape header's backdrop-filter containing block */}
      {mounted &&
        createPortal(
          <div
            className={`lg:hidden fixed inset-0 z-[80] transition-opacity duration-300 ${
              mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!mobileOpen}
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-charbon/50 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <aside
              className={`absolute inset-y-0 left-0 w-[88%] max-w-[380px] bg-ivory shadow-xl flex flex-col transition-transform duration-300 ease-out ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-label="Menu principal"
            >
              {/* Sticky header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-ivory">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col leading-none"
                >
                  <span className="font-display text-2xl tracking-[0.04em]">Ö' Sweets</span>
                  <span className="text-[9px] tracking-[0.4em] uppercase text-gold mt-1">
                    Pâtisserie
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer"
                  className="p-2 -mr-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Scrollable body */}
              <nav
                className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <ul className="divide-y divide-border">
                  {NAV.map((item) => {
                    const expanded = mobileExpanded === item.label;
                    const hasChildren = !!item.cols?.length;
                    return (
                      <li key={item.label}>
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => setMobileExpanded(expanded ? null : item.label)}
                            aria-expanded={expanded}
                            className="w-full flex items-center justify-between py-4 tracking-[0.2em] uppercase text-sm text-charbon text-left"
                          >
                            <span>{item.label}</span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                expanded ? "rotate-180 text-gold" : ""
                              }`}
                            />
                          </button>
                        ) : (
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between py-4 tracking-[0.2em] uppercase text-sm text-charbon"
                          >
                            {item.label}
                          </Link>
                        )}

                        {hasChildren && (
                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="pb-4 space-y-4">
                                <Link
                                  to={item.to}
                                  onClick={() => setMobileOpen(false)}
                                  className="block text-[11px] tracking-[0.22em] uppercase text-gold"
                                >
                                  → Voir tout {item.label}
                                </Link>
                                {item.cols!.map((col) => (
                                  <div key={col.title}>
                                    <div className="text-[10px] tracking-[0.28em] uppercase text-charbon/50 mb-2">
                                      {col.title}
                                    </div>
                                    <ul className="space-y-1">
                                      {col.items.map((l) => (
                                        <li key={l.to + l.label}>
                                          <Link
                                            to={l.to}
                                            onClick={() => setMobileOpen(false)}
                                            className={`block py-2 text-sm ${
                                              l.highlight
                                                ? "text-gold font-medium"
                                                : "text-charbon/80"
                                            }`}
                                          >
                                            {l.label}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="block py-4 tracking-[0.2em] uppercase text-sm text-charbon"
                    >
                      Contact & Informations
                    </Link>
                  </li>
                </ul>

                <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center gap-4 text-sm text-charbon/70">
                  <Link
                    to="/mon-compte"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-2"
                  >
                    <User className="h-4 w-4" /> Mon compte
                  </Link>
                  {FEATURES.favorites && (
                    <Link
                      to="/favoris"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" /> Favoris
                    </Link>
                  )}
                </div>

                <div className="mt-6 text-[11px] text-charbon/55 leading-relaxed">
                  Pâtisserie · Évry-Courcouronnes
                  <br />
                  Retrait sur rendez-vous
                </div>
              </nav>

              {/* Sticky bottom CTAs */}
              <div className="shrink-0 border-t border-border bg-ivory px-5 py-4 grid gap-2.5">
                <Link
                  to="/composer"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-gold justify-center"
                >
                  Composer mon coffret
                </Link>
                <Link
                  to="/devis"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-outline-gold justify-center"
                >
                  Demander un devis
                </Link>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
}
