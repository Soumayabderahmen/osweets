import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function CustomOrderFloat() {
  return (
    <Link
      to="/creation-sur-mesure"
      search={{ type: undefined }}
      aria-label="Demander une création sur mesure"
      className="fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 bg-charbon text-ivory border border-gold/60 px-4 py-3 text-[11px] uppercase tracking-[0.22em] shadow-lg hover:bg-gold hover:text-charbon transition-colors"
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden sm:inline">Demander une création sur mesure</span>
      <span className="sm:hidden">Sur mesure</span>
    </Link>
  );
}
