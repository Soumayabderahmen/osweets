import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function CustomOrderFloat() {
  return (
    <Link
      to="/creation-sur-mesure"
      search={{ type: undefined }}
      aria-label="Demander une création sur mesure"
      className="fixed bottom-6 left-6 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-xs uppercase tracking-[0.2em] text-white shadow-lg transition-colors hover:bg-charbon"
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden sm:inline">Demander une création sur mesure</span>
      <span className="sm:hidden">Sur mesure</span>
    </Link>
  );
}
