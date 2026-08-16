/* ─────────────────────────────────────────────────────────────────────────────
   ReviewBlock — avis encadré (score, citation, bouton)
   ───────────────────────────────────────────────────────────────────────────── */
export const ReviewBlock = () => {
  const store = useStore()
  const score = store.state.avisScore ?? 5
  const citation = store.state.avisCitation ?? "La meilleure pâtisserie artisanale que j'avais jamais goûtée."

  return (
    <div className="rounded-2xl bg-ivory/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-2xl font-medium text-gold">⭐ {score}</div>
      <blockquote className="italic text-xs text-ivory/50 mt-1">
        {citation}
      </blockquote>
      <Link
        to="/avis"
        className="self-start px-3 py-1 bg-ivory border border-ivory/20 rounded-full text-xs uppercase tracking-[0.15em] text-ivory/70 hover:bg-gold hover:text-charbon transition-colors"
      >
        Voir les avis
      </Link>
    </div>
  )
}
