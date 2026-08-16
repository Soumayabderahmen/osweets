import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AdminSection {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Pastille de comptage affichée à droite de l'entrée. */
  badge?: number;
  /** Sous-rubriques — l'entrée devient alors un dossier dépliable. */
  children?: AdminSubSection[];
}

export interface AdminSubSection {
  key: string;
  label: string;
  badge?: number;
}

export interface AdminNavGroup {
  title: string;
  items: AdminSection[];
}

/**
 * Coquille du back-office.
 *
 * Mise en page reprise du modèle Soft UI Dashboard : barre latérale
 * flottante arrondie, surfaces blanches sans bordure détachées par une
 * ombre douce, barre supérieure translucide. Les couleurs, elles, restent
 * celles de la maison — sable, charbon, or, Playfair pour les titres.
 */
export function AdminShell({
  groups,
  active,
  onSelect,
  email,
  onSignOut,
  title,
  breadcrumb,
  search,
  onSearch,
  actions,
  children,
}: {
  groups: AdminNavGroup[];
  active: string;
  onSelect: (key: string) => void;
  email: string;
  onSignOut: () => void;
  title: string;
  breadcrumb: string;
  search?: string;
  onSearch?: (value: string) => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Dossiers dépliés — non renseigné = ouvert si l'une de ses rubriques est active. */
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // La barre supérieure est transparente en haut de page, puis se pose
  // sur un voile blanc floute dès que l'on descend.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="relative px-6 pb-2 pt-6 text-center">
        <div className="font-display text-2xl leading-none text-charbon">Ö' Sweets</div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-gold">Administration</div>
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-charbon/40 hover:text-charbon xl:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="divider-soft mx-4 my-4" />

      <div className="flex-1 space-y-5 overflow-y-auto pb-4">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mx-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-charbon/45">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const childKeys = (item.children ?? []).map((c) => c.key);
                const isActive = item.key === active || childKeys.includes(active);
                const isOpen = item.children ? (openFolders[item.key] ?? isActive) : false;

                return (
                  <div key={item.key}>
                    <button
                      onClick={() => {
                        if (item.children?.length) {
                          setOpenFolders((f) => ({ ...f, [item.key]: !isOpen }));
                          // Ouvrir un dossier fermé amène sur sa première rubrique.
                          if (!isOpen && !childKeys.includes(active)) {
                            onSelect(item.children[0].key);
                          }
                        } else {
                          onSelect(item.key);
                          setOpen(false);
                        }
                      }}
                      className={`mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-lg py-[10px] pl-4 pr-3 text-sm transition ${
                        isActive && !item.children ? "card-soft text-charbon" : ""
                      } ${isActive ? "text-charbon" : "text-charbon/60 hover:text-charbon"}`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg shadow-soft ${
                          isActive ? "icon-gradient-gold text-white" : "bg-sable text-charbon/55"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isActive ? "bg-gold/15 text-gold" : "bg-sable text-charbon/60"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.children?.length ? (
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-charbon/40 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      ) : null}
                    </button>

                    {item.children?.length && isOpen ? (
                      <div className="relative ml-[42px] mr-4 mt-1 space-y-0.5 border-l border-beige pl-3">
                        {item.children.map((child) => {
                          const childActive = child.key === active;
                          return (
                            <button
                              key={child.key}
                              onClick={() => {
                                onSelect(child.key);
                                setOpen(false);
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition ${
                                childActive
                                  ? "bg-white font-semibold text-charbon shadow-soft"
                                  : "text-charbon/55 hover:text-charbon"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  childActive ? "bg-gold" : "bg-charbon/20"
                                }`}
                              />
                              <span className="flex-1 text-left">{child.label}</span>
                              {child.badge !== undefined && child.badge > 0 && (
                                <span className="text-[10px] font-semibold text-charbon/45">
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-tl from-charbon to-[#4a3f3a] p-4 text-ivory">
          <div className="font-display text-base leading-tight">Boutique en ligne</div>
          <p className="mt-1 text-[11px] leading-relaxed text-ivory/70">
            Vérifiez le rendu côté cliente après vos modifications.
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ivory/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory transition hover:bg-ivory/20"
          >
            Voir le site <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sable">
      {/* Barre latérale flottante */}
      <aside className="fixed inset-y-4 left-4 z-40 hidden w-[250px] overflow-hidden rounded-2xl bg-ivory shadow-soft-lg xl:block">
        {nav}
      </aside>

      {open && (
        <>
          <button
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-charbon/40 xl:hidden"
          />
          <aside className="fixed inset-y-4 left-4 z-50 w-[250px] overflow-hidden rounded-2xl bg-ivory shadow-soft-lg xl:hidden">
            {nav}
          </aside>
        </>
      )}

      <div className="xl:pl-[282px]">
        <div className="px-4 xl:pr-8">
          {/* Barre supérieure */}
          <header
            className={`sticky top-3 z-30 mt-3 flex items-center gap-4 rounded-2xl px-4 py-3 transition-all lg:px-6 ${
              scrolled ? "navbar-soft bg-white/80" : ""
            }`}
          >
            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg bg-white text-charbon/60 shadow-soft xl:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-charbon/45">
                Administration <span className="mx-1 text-charbon/25">/</span>
                <span className="text-charbon/70">{breadcrumb}</span>
              </div>
              <h1 className="truncate font-display text-lg leading-tight text-charbon lg:text-xl">
                {title}
              </h1>
            </div>

            {onSearch && (
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charbon/35" />
                <input
                  value={search ?? ""}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-56 rounded-full border border-beige bg-white/70 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:bg-white"
                />
              </div>
            )}

            {actions}

            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <div className="max-w-[190px] truncate text-xs font-semibold text-charbon">
                  {email}
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-charbon/40">
                  Administratrice
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Se déconnecter"
                className="grid h-10 w-10 place-items-center rounded-lg bg-white text-charbon/55 shadow-soft transition hover:text-gold"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>

          <main className="py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
