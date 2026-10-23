import { Link } from "@tanstack/react-router";

/**
 * Ce qu'on montre quand PostgreSQL ne répond pas.
 *
 * Il n'existe plus de catalogue de secours pour la Pâtisserie Tunisienne :
 * c'est un choix, pas un oubli. Un prix périmé, une photo remplacée depuis
 * ou un produit retiré de la vente qui réapparaîtrait pendant une panne
 * feraient plus de dégâts qu'une page qui dit honnêtement « revenez dans un
 * instant » — d'autant qu'une commande ne pourrait de toute façon pas être
 * enregistrée, faute de base pour l'écrire.
 *
 * Le reste du site (gâteaux, salé, coffrets) continue de fonctionner : cette
 * page ne couvre que l'univers pâtisserie.
 */
export function PatisserieIndisponible({ contexte }: { contexte?: string }) {
  return (
    <div className="container-os section-y">
      <div className="mx-auto max-w-xl py-16 text-center">
        <span className="font-display text-6xl text-gold/25">Ö</span>
        {/*
          Le nom de la page reste affiché — la cliente doit se reconnaître —
          mais il ne remplace jamais le message : quelle que soit la page,
          « momentanément indisponible » est écrit noir sur blanc.
        */}
        {contexte && (
          <div className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold">{contexte}</div>
        )}
        <h1 className="mt-4 font-display text-3xl text-charbon md:text-4xl">
          Boutique momentanément indisponible
        </h1>
        <div className="mt-5">
          <span className="divider-gold" />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-charbon/70">
          Nos pâtisseries reviennent dans un instant. Nous préférons ne rien vous montrer plutôt
          que de vous montrer des prix ou des disponibilités qui ne seraient plus les bons.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-charbon/70">
          Le reste de la boutique reste accessible, et notre atelier répond toujours.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/gateaux" className="btn btn-gold">
            Voir les gâteaux
          </Link>
          <Link to="/contact" className="btn btn-outline-gold">
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
