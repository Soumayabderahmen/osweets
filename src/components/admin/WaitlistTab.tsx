import { toast } from "sonner";

import type { WaitlistRow } from "@/api/waitlist";

/** Échappement CSV : guillemets doublés, champ toujours quoté. */
const csvCell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function WaitlistTab({ entries }: { entries: WaitlistRow[] }) {
  /** Export CSV (séparateur `;` + BOM UTF-8 : s'ouvre proprement dans Excel FR). */
  const exportCsv = () => {
    if (!entries.length) {
      toast.error("Aucune inscription à exporter.");
      return;
    }
    const head = ["E-mail", "Collection", "Date d'inscription"];
    const body = entries.map((w) =>
      [w.email, w.collection, new Date(w.created_at).toLocaleString("fr-FR")]
        .map(csvCell)
        .join(";"),
    );
    const blob = new Blob(["﻿" + [head.map(csvCell).join(";"), ...body].join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liste-attente-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${entries.length} inscription(s) exportée(s).`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-charbon/70">
          {entries.length} inscription{entries.length > 1 ? "s" : ""} en attente de notification.
        </p>
        <button
          onClick={exportCsv}
          disabled={!entries.length}
          className={`rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90 ${!entries.length ? "opacity-40" : ""}`}
        >
          Exporter en CSV
        </button>
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-charbon/45">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((w) => (
              <tr key={w.id} className="border-t border-beige/60">
                <td className="px-4 py-3">{w.email}</td>
                <td className="px-4 py-3">{w.collection}</td>
                <td className="px-4 py-3 text-charbon/60">
                  {new Date(w.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-charbon/60">
                  Aucune inscription pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
