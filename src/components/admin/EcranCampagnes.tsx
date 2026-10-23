import { useMemo, useState } from "react";
import { deleteSeason, saveSeason, type SeasonRow } from "@/api/seasons";
import { agir, enBoutique, type Contexte } from "./core";

/**
 * Écran « Ramadan & Aïd ».
 *
 * Les dates des fêtes étaient écrites dans le code, année par année,
 * jusqu'en 2028. En 2029 la collection Ramadan ne se serait plus jamais
 * ouverte — et rien n'aurait dit pourquoi. Le calendrier hégirien se
 * décale d'environ onze jours chaque année ; un fichier, non.
 *
 * Ici, chaque fête est une ligne : sa date de début, sa date de fin, et le
 * nombre de jours de précommande qui ouvrent la collection en avance. Le
 * code ne connaît plus aucune date, il sait seulement comparer.
 */
export function EcranCampagnes({ ctx }: { ctx: Contexte }) {
  const vivants = enBoutique(ctx.produits);
  const saisonniers = vivants.filter((p) => p.seasonal_only);
  const [nouvelle, setNouvelle] = useState(false);

  const aujourdhui = new Date().toISOString().slice(0, 10);

  /** Les fêtes groupées par clé, la plus proche d'abord. */
  const parCle = useMemo(() => {
    const m = new Map<string, SeasonRow[]>();
    for (const s of ctx.saisons) {
      const l = m.get(s.season_key) ?? [];
      l.push(s);
      m.set(s.season_key, l);
    }
    for (const l of m.values()) l.sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ctx.saisons]);

  /** Les clés qu'un produit saisonnier réclame et qu'aucune ligne ne couvre. */
  const orphelines = useMemo(() => {
    const connues = new Set(ctx.saisons.map((s) => s.season_key));
    const manquantes = new Set<string>();
    // Un produit saisonnier dont aucune collection n'a de fenêtre reste caché.
    for (const p of saisonniers) {
      const cols = p.collections ?? [];
      if (cols.length && !cols.some((c) => connues.has(c))) {
        for (const c of cols) manquantes.add(c);
      }
      if (!cols.length) manquantes.add("(aucune collection)");
    }
    return [...manquantes];
  }, [ctx.saisons, saisonniers]);

  return (
    <>
      <div className="note">
        Une <b>fenêtre</b> ouvre une collection saisonnière à une date et la referme à une autre.
        Tant qu'aucune fenêtre n'est ouverte, ses produits ne sont pas proposés — ils ne
        disparaissent pas de vos fiches, ils attendent.
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="grouphead" style={{ marginTop: 0 }}>
          <h3>Calendrier des fêtes</h3>
          <button type="button" className="btn-ghost" onClick={() => setNouvelle(true)}>
            + Ajouter une fête
          </button>
        </div>
        <div className="sub">
          Le calendrier hégirien avance d'environ onze jours par an : ajoutez les prochaines fêtes
          quand vous les connaissez, elles s'ouvriront toutes seules.
        </div>

        {nouvelle && (
          <LigneSaison
            row={null}
            ctx={ctx}
            aujourdhui={aujourdhui}
            onFini={() => setNouvelle(false)}
          />
        )}

        {parCle.length === 0 && !nouvelle ? (
          <div className="empty">
            Aucune fête enregistrée — aucune collection saisonnière ne s'ouvrira.
          </div>
        ) : (
          parCle.map(([cle, lignes]) => (
            <div key={cle}>
              <div className="subh">
                {ctx.collections.find((c) => c.product_key === cle)?.label ?? cle}
              </div>
              {lignes.map((s) => (
                <LigneSaison key={s.id} row={s} ctx={ctx} aujourdhui={aujourdhui} />
              ))}
            </div>
          ))
        )}
      </div>

      {orphelines.length > 0 && (
        <div className="note" style={{ borderLeftColor: "#c0392b", marginBottom: 18 }}>
          <b>Attention.</b> Des produits saisonniers dépendent de{" "}
          <b>{orphelines.join(", ")}</b>, qui n'a aucune fenêtre : ils resteront invisibles en
          boutique tant que vous n'en aurez pas ajouté une.
        </div>
      )}

      <div className="card">
        <h3>Produits saisonniers</h3>
        <div className="sub">
          {saisonniers.length} produit{saisonniers.length > 1 ? "s" : ""} ne sortent que pendant une
          fête. Le drapeau se coche sur la fiche du produit, dans « Livraison, délai &amp; saison ».
        </div>
        <div className="list" style={{ marginTop: 14 }}>
          {saisonniers.map((p) => (
            <div className="row" key={p.id}>
              {p.image_url ? <img src={p.image_url} alt="" /> : <div className="ph">Ö</div>}
              <div className="id">
                <div className="n">{p.name}</div>
                <div className="m">{(p.collections ?? []).join(", ") || "aucune collection"}</div>
              </div>
              <div className="act">
                <button
                  type="button"
                  className="icobtn"
                  onClick={() => ctx.ouvrir({ type: "produit", row: p })}
                >
                  ✎
                </button>
              </div>
            </div>
          ))}
          {saisonniers.length === 0 && (
            <div className="empty">Aucun produit saisonnier pour l'instant.</div>
          )}
        </div>
      </div>
    </>
  );
}

/** Une fête — en lecture, puis en édition quand on la déplie. */
function LigneSaison({
  row,
  ctx,
  aujourdhui,
  onFini,
}: {
  row: SeasonRow | null;
  ctx: Contexte;
  aujourdhui: string;
  onFini?: () => void;
}) {
  const [ouvert, setOuvert] = useState(row === null);
  const [v, setV] = useState({
    season_key: row?.season_key ?? "ramadan",
    label: row?.label ?? "",
    starts_on: String(row?.starts_on ?? aujourdhui).slice(0, 10),
    ends_on: String(row?.ends_on ?? aujourdhui).slice(0, 10),
    preorder_days: row?.preorder_days ?? 0,
    active: row?.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  const jour = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /** L'ouverture réelle, précommande comprise — c'est elle qui compte. */
  const ouverture = new Date(
    new Date(`${v.starts_on}T00:00:00`).getTime() - v.preorder_days * 86_400_000,
  );
  const ouvertureISO = ouverture.toISOString().slice(0, 10);
  const enCours = v.active && aujourdhui >= ouvertureISO && aujourdhui <= v.ends_on;
  const passee = v.ends_on < aujourdhui;

  const enregistrer = async () => {
    setBusy(true);
    await agir(
      () => saveSeason({ data: { id: row?.id, values: v } }),
      row ? "Fête mise à jour." : "Fête ajoutée.",
      ctx.recharger,
    );
    setBusy(false);
    if (row) setOuvert(false);
    onFini?.();
  };

  const supprimer = async () => {
    if (!row) return;
    setBusy(true);
    await agir(() => deleteSeason({ data: { id: row.id } }), "Fête retirée.", ctx.recharger);
    setBusy(false);
  };

  if (!ouvert && row) {
    return (
      <div className="row">
        <div className="id">
          <div className="n">
            {row.label || row.season_key}{" "}
            {enCours ? (
              <span className="tag pub">en cours</span>
            ) : !row.active ? (
              <span className="tag hide">désactivée</span>
            ) : passee ? (
              <span className="tag arch">passée</span>
            ) : (
              <span className="tag soon">à venir</span>
            )}
          </div>
          <div className="m">
            du {jour(String(row.starts_on).slice(0, 10))} au {jour(String(row.ends_on).slice(0, 10))}
            {row.preorder_days > 0
              ? ` — précommandes ${row.preorder_days} jour${row.preorder_days > 1 ? "s" : ""} avant`
              : ""}
          </div>
        </div>
        <div className="act">
          <button type="button" className="icobtn" onClick={() => setOuvert(true)}>
            ✎
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ margin: "12px 0", background: "#fbf9f5" }}>
      <div className="two">
        <label className="f">
          <span>Collection concernée</span>
          <select
            value={v.season_key}
            onChange={(e) => setV((p) => ({ ...p, season_key: e.target.value }))}
          >
            {ctx.collections.map((c) => (
              <option key={c.id} value={c.product_key}>
                {c.label}
              </option>
            ))}
            {!ctx.collections.some((c) => c.product_key === v.season_key) && (
              <option value={v.season_key}>{v.season_key}</option>
            )}
          </select>
        </label>
        <label className="f">
          <span>Nom de la fête</span>
          <input
            value={v.label}
            placeholder="Ramadan 2029"
            onChange={(e) => setV((p) => ({ ...p, label: e.target.value }))}
          />
        </label>
      </div>

      <div className="two" style={{ marginTop: 12 }}>
        <label className="f">
          <span>Premier jour</span>
          <input
            type="date"
            value={v.starts_on}
            onChange={(e) => setV((p) => ({ ...p, starts_on: e.target.value }))}
          />
        </label>
        <label className="f">
          <span>Dernier jour</span>
          <input
            type="date"
            value={v.ends_on}
            onChange={(e) => setV((p) => ({ ...p, ends_on: e.target.value }))}
          />
        </label>
      </div>

      <div className="two" style={{ marginTop: 12 }}>
        <label className="f">
          <span>Précommandes — jours d'avance</span>
          <input
            value={v.preorder_days}
            onChange={(e) =>
              setV((p) => ({ ...p, preorder_days: Math.max(0, Number(e.target.value) || 0) }))
            }
          />
        </label>
        <label className="f">
          <span>Fête active</span>
          <select
            value={v.active ? "oui" : "non"}
            onChange={(e) => setV((p) => ({ ...p, active: e.target.value === "oui" }))}
          >
            <option value="oui">Oui — elle ouvrira la collection</option>
            <option value="non">Non — ignorée</option>
          </select>
        </label>
      </div>

      <div className="livex" style={{ marginTop: 12 }}>
        {v.ends_on < v.starts_on ? (
          <b>La date de fin est avant la date de début.</b>
        ) : (
          <>
            La collection s'ouvrira le <b>{jour(ouvertureISO)}</b>
            {v.preorder_days > 0 ? " (précommandes comprises)" : ""} et se refermera le{" "}
            <b>{jour(v.ends_on)}</b>.
          </>
        )}
      </div>

      <div className="foot" style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn-dark"
          disabled={busy || v.ends_on < v.starts_on}
          onClick={() => void enregistrer()}
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => {
            setOuvert(false);
            onFini?.();
          }}
        >
          Annuler
        </button>
        <span className="grow" />
        {row && (
          <button
            type="button"
            className="btn-ghost danger"
            disabled={busy}
            onClick={() => void supprimer()}
          >
            Retirer cette fête
          </button>
        )}
      </div>
    </div>
  );
}
