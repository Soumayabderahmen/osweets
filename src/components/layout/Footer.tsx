import { Link } from "@tanstack/react-router";
import { MessageCircle, Star } from "lucide-react";

const IgIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);
const FbIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13 22v-8h2.7l.4-3.1H13V8.9c0-.9.3-1.5 1.5-1.5H16V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.4H7.2V14h2.7v8H13z" />
  </svg>
);

// Mêmes collections que le mega menu "Pâtisserie Tunisienne" du Header.
const FOOTER_COLLECTIONS = [
  { to: "/patisserie/amandes", label: "Amandes" },
  { to: "/patisserie/pistache-machmoum-pignon", label: "Pistache, Machmoum & Pignon" },
  { to: "/patisserie/perles", label: "Perles" },
  { to: "/patisserie/tradition", label: "Tradition" },
  { to: "/patisserie/ramadan", label: "Ramadan" },
  { to: "/patisserie/aid", label: "Aïd" },
];

export function Footer() {
  return (
    <footer className="bg-charbon text-ivory mt-20 mosaic-bg mosaic-bg-dark">
      <div className="container-os py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="font-display text-3xl">Ö' Sweets</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-5 mt-1.5">
            Pâtisserie
          </div>
          <p className="text-sm leading-relaxed text-ivory/55 max-w-sm">
            L'art de la pâtisserie tunisienne, sublimé par l'élégance française.
            <br />
            Évry-Courcouronnes, livraison dans toute la France.
          </p>
          <div className="flex gap-3 mt-6">
            <a
              href="https://www.instagram.com/osweet_patisserie/"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 grid place-items-center border border-ivory/30 rounded-full hover:bg-gold hover:border-gold transition"
              aria-label="Instagram"
            >
              <IgIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/OSweets.fr"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 grid place-items-center border border-ivory/30 rounded-full hover:bg-gold hover:border-gold transition"
              aria-label="Facebook"
            >
              <FbIcon className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/33699466030"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 grid place-items-center border border-ivory/30 rounded-full hover:bg-[#25D366] hover:border-[#25D366] transition"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-[10px] tracking-[0.22em] uppercase text-gold mb-4">Boutique</h4>
          <ul className="space-y-2.5 text-sm text-ivory/80">
            <li>
              <Link to="/patisserie" className="hover:text-gold">
                Toutes les pâtisseries
              </Link>
            </li>
            <li>
              <Link to="/gateaux" className="hover:text-gold">
                Gâteaux
              </Link>
            </li>
            <li>
              <Link to="/gateaux/anniversaire" className="hover:text-gold">
                Gâteaux d'anniversaire
              </Link>
            </li>
            <li>
              <Link to="/gateaux/wedding-cakes" className="hover:text-gold">
                Wedding Cakes
              </Link>
            </li>
            <li>
              <Link to="/cadeaux" className="hover:text-gold">
                Coffrets cadeaux
              </Link>
            </li>
            <li>
              <Link to="/packs/fiancailles" className="hover:text-gold">
                Packs Fiançailles
              </Link>
            </li>
            <li>
              <Link to="/evenements/mariage" className="hover:text-gold">
                Packs Mariage
              </Link>
            </li>
          </ul>
          <div className="text-[10px] tracking-[0.22em] uppercase text-gold/70 mt-5 mb-2.5">
            Collections
          </div>
          <ul className="space-y-2.5 text-sm text-ivory/80">
            {FOOTER_COLLECTIONS.map((c) => (
              <li key={c.to}>
                <Link to={c.to} className="hover:text-gold">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-[10px] tracking-[0.22em] uppercase text-gold mb-4">La maison</h4>
          <ul className="space-y-2.5 text-sm text-ivory/80">
            <li>
              <Link to="/la-maison" className="hover:text-gold">
                Notre histoire
              </Link>
            </li>
            <li>
              <Link to="/galerie" className="hover:text-gold">
                Galerie
              </Link>
            </li>
            <li>
              <Link to="/sur-mesure" className="hover:text-gold">
                Commandes sur mesure
              </Link>
            </li>
            <li>
              <Link to="/parrainage" className="hover:text-gold">
                Programme de fidélité
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-gold">
                FAQ
              </Link>
            </li>
            <li>Évry-Courcouronnes, France</li>
            <li>
              <a href="mailto:contact@osweets.fr" className="hover:text-gold">
                contact@osweets.fr
              </a>
            </li>
            <li>
              <a href="tel:+33699466030" className="hover:text-gold">
                +33 6 99 46 60 30
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Avis */}
      <div className="border-t border-ivory/10">
        <div className="container-os py-8">
          <div className="rounded-2xl bg-ivory/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex gap-0.5 text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </span>
                <span className="text-sm text-gold font-medium">4,9/5</span>
                <span className="text-sm text-ivory/60">· Avis Google & Facebook</span>
              </div>
              <div className="text-xs text-ivory/50 italic mt-1">
                « Une pâtisserie d'exception, on goûte chaque saveur avec émerveillement. »
              </div>
            </div>
            <a
              href="https://www.facebook.com/OSweets.fr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-ivory/20 px-6 text-xs uppercase tracking-[0.18em] text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-charbon"
            >
              Laisser un avis
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-ivory/10 mt-0">
        <div className="container-os py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/40">
          <p>© {new Date().getFullYear()} Ö' Sweets Pâtisserie — Tous droits réservés</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/cgv" className="hover:text-gold">
              CGV
            </Link>
            <Link to="/confidentialite" className="hover:text-gold">
              Confidentialité
            </Link>
            <Link to="/cookies" className="hover:text-gold">
              Cookies
            </Link>
            <Link to="/livraison" className="hover:text-gold">
              Livraison
            </Link>
            <Link to="/remboursement" className="hover:text-gold">
              Remboursement
            </Link>
          </div>
          <p className="tracking-[0.15em] uppercase">
            Pâtisserie tunisienne artisanale, sublimée à la française
          </p>
        </div>
      </div>
    </footer>
  );
}
