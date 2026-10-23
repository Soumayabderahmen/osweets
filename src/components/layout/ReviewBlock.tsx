import { Link } from "@tanstack/react-router";

/* ─────────────────────────────────────────────────────────────────────────────
   ReviewBlock — avis encadré (score, citation, bouton)
   ───────────────────────────────────────────────────────────────────────────── */
interface ReviewBlockProps {
  score?: number;
  citation?: string;
}

export const ReviewBlock = ({
  score = 5,
  citation = "La meilleure pâtisserie artisanale que j'avais jamais goûtée.",
}: ReviewBlockProps) => {
  return (
    <div className="rounded-2xl bg-ivory/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-2xl font-medium text-gold">⭐ {score}</div>
      <blockquote className="italic text-xs text-ivory/50 mt-1">
        {citation}
      </blockquote>
      <Link
        to="/la-maison"
        className="self-start px-3 py-1 bg-ivory border border-ivory/20 rounded-full text-xs uppercase tracking-[0.15em] text-ivory/70 hover:bg-gold hover:text-charbon transition-colors"
      >
        Voir les avis
      </Link>
    </div>
  );
};
