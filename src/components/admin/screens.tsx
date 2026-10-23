import { adminImage, alertes, bas, dispo, enBoutique, euro, type Contexte } from "./core";
import { collectionCounts, collectionState } from "@/lib/collection-presentation";
import { rowToProduct } from "@/lib/catalog";
import { toWindows } from "@/lib/season";
import { usePageBannerImage } from "@/lib/banners";

/** Tableau de bord — ce qu'il faut regarder en arrivant le matin. */
export function EcranBord({ ctx }: { ctx: Contexte }) {
  const { produits, collections, attente, ouvrir, aller } = ctx;
  const vivants = enBoutique(produits);
  const epuises = vivants.filter((r) => !dispo(r));
  const faibles = vivants.filter(bas);
  const archives = produits.filter((r) => r.archived);
  const sansCollection = vivants.filter((r) => !(r.collections ?? []).length);
  const max = Math.max(
    1,
    ...collections.map(
      (c) => vivants.filter((r) => (r.collections ?? []).includes(c.product_key)).length,
    ),
  );

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <div>
            <div className="l">Produits en boutique</div>
            <div className="v">{vivants.length}</div>
            <div className="h">sur {produits.length} fiches</div>
          </div>
          <div className="ic">▣</div>
        </div>
        <div className={`kpi${epuises.length ? " warn" : ""}`}>
          <div>
            <div className="l">Épuisés</div>
            <div className="v">{epuises.length}</div>
            <div className="h">commande bloquée</div>
          </div>
          <div className="ic">▢</div>
        </div>
        <div className={`kpi${faibles.length ? " warn" : ""}`}>
          <div>
            <div className="l">Bientôt finis</div>
            <div className="v">{faibles.length}</div>
            <div className="h">à refaire</div>
          </div>
          <div className="ic">▤</div>
        </div>
        <div className="kpi">
          <div>
            <div className="l">Liste d'attente</div>
            <div className="v">{attente.length}</div>
            <div className="h">à prévenir</div>
          </div>
          <div className="ic">◔</div>
        </div>
      </div>

      <div className="cols2">
        <div className="card">
          <h3>Produits par collection</h3>
          <div className="sub">Une collection vide affiche « bientôt disponible ».</div>
          {collections.map((c) => {
            const n = vivants.filter((r) => (r.collections ?? []).includes(c.product_key)).length;
            return (
              <div className="bar" key={c.id}>
                <div className="t">
                  <span>{c.label}</span>
                  <span>{n}</span>
                </div>
                <div className="g">
                  <i style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3>À faire</h3>
          <div className="sub">Ce que la boutique attend de vous.</div>

          {alertes(produits).length > 0 && (
            <button type="button" className="todo" onClick={() => ouvrir({ type: "alertes" })}>
              <div className="b">{alertes(produits).length}</div>
              <div>
                <div className="t1">Produits à surveiller</div>
                <div className="t2">Épuisés ou bientôt finis — voir les alertes</div>
              </div>
            </button>
          )}

          {sansCollection.length > 0 && (
            <button type="button" className="todo" onClick={() => aller("produits")}>
              <div className="b">{sansCollection.length}</div>
              <div>
                <div className="t1">Produits sans collection</div>
                <div className="t2">Ils n'apparaissent que sur la page complète</div>
              </div>
            </button>
          )}

          {archives.length > 0 && (
            <button type="button" className="todo" onClick={() => aller("produits")}>
              <div className="b">{archives.length}</div>
              <div>
                <div className="t1">Fiches archivées</div>
                <div className="t2">Hors boutique, récupérables à tout moment</div>
              </div>
            </button>
          )}

          {alertes(produits).length === 0 &&
            sansCollection.length === 0 &&
            archives.length === 0 && (
              <div className="empty">Rien à signaler. Tout est en ordre.</div>
            )}
        </div>
      </div>
    </>
  );
}

/** Les collections — une collection, c'est une page de la boutique. */
export function EcranCollections({ ctx }: { ctx: Contexte }) {
  const { produits, collections, ouvrir } = ctx;
  const vivants = enBoutique(produits);
  const defaultImage = usePageBannerImage("patisserie-collection-defaut");

  return (
    <>
      <div className="note">
        Une collection = une page de la boutique. Vous pilotez son nom, son texte, sa photo, son
        ordre, et surtout <b>les produits qu'elle contient</b>.
      </div>

      <div className="grid3">
        {collections.map((c) => {
          const items = vivants.filter((r) => (r.collections ?? []).includes(c.product_key));
          const counts = collectionCounts(
            produits.map(rowToProduct),
            c.product_key,
            toWindows(ctx.saisons),
          );
          const state = collectionState(c);
          const cover =
            c.image_url || (c.image_key ? `/api/public/media/${c.image_key}` : "") || defaultImage;
          return (
            <div className="ccard" key={c.id}>
              <div className="cover">
                {cover ? <img src={cover} alt="" /> : <div className="none">Ö</div>}
                <div className="badges">
                  {state !== "online" && (
                    <span className="tag hide">
                      {state === "hidden" ? "Masquée du public" : "Dépubliée"}
                    </span>
                  )}
                  {items.length === 0 && <span className="tag soon">Bientôt disponible</span>}
                </div>
              </div>
              <div className="in">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3>{c.label}</h3>
                    <div className="url">/patisserie/{c.slug}</div>
                  </div>
                  <div className="num">
                    <b>{counts.associated}</b>
                    <small>associés</small>
                  </div>
                </div>
                <p className="hint">
                  {counts.published} publié(s), {counts.visible} visible(s) aujourd'hui,{" "}
                  {counts.commandable} commandable(s)
                  {counts.archived > 0 ? `, ${counts.archived} archivé(s)` : ""}
                  {state !== "online" ? " ; collection absente du public" : ""}. Les produits
                  épuisés restent visibles.
                </p>
                <p className="s">{c.subtitle}</p>
                <div className="mini">
                  {items
                    .slice(0, 4)
                    .map((p) =>
                      adminImage(p) ? (
                        <img key={p.id} src={adminImage(p)} title={p.name} alt="" />
                      ) : null,
                    )}
                  {items.length === 0 && (
                    <span style={{ fontSize: 11, color: "rgba(41,34,31,.45)" }}>
                      Aucun produit — sa page invite à s'inscrire à la liste d'attente
                    </span>
                  )}
                </div>
                <div className="foot">
                  <button
                    type="button"
                    className="btn-dark"
                    onClick={() => ouvrir({ type: "collection", row: c })}
                  >
                    ✎ Modifier
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => ouvrir({ type: "collection-products", row: c })}
                  >
                    Ses produits
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => ouvrir({ type: "collection-add-products", row: c })}
                  >
                    Ajouter des produits
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="ccard"
          style={{
            border: "2px dashed var(--beige)",
            boxShadow: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={() => ouvrir({ type: "collection", row: null })}
        >
          <div
            className="in"
            style={{
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: 280,
            }}
          >
            <div style={{ fontSize: 30, color: "rgba(41,34,31,.25)" }}>+</div>
            <h3 style={{ marginTop: 8 }}>Nouvelle collection</h3>
            <p className="s" style={{ flex: 0 }}>
              Fekia, Mariage, Sans sucre… Elle obtient sa page automatiquement.
            </p>
          </div>
        </button>
      </div>
    </>
  );
}

/** Familles & parfums — ce qui alimente « Autres parfums » sur la fiche. */
export function EcranFamilles({ ctx }: { ctx: Contexte }) {
  const { produits, familles, ouvrir } = ctx;
  const vivants = enBoutique(produits);
  const orphelins = vivants.filter((p) => p.family && !p.flavor_label);

  return (
    <>
      <div className="note">
        Une famille regroupe les parfums d'une même recette. C'est ce qui alimente le bloc{" "}
        <b>« Autres parfums »</b> sur la fiche produit. La famille regroupe, la collection classe,
        le parfum distingue.
      </div>

      {orphelins.length > 0 && (
        <div className="note" style={{ borderLeftColor: "var(--gold)" }}>
          <b>{orphelins.length} produit(s)</b> sont dans une famille sans nom de parfum :{" "}
          {orphelins.map((p) => p.name).join(", ")}. Leur nom complet s'affiche alors sous la
          vignette.
        </div>
      )}

      <div className="grid3">
        {familles.map((f) => {
          const membres = vivants.filter((p) => p.family === f.key);
          return (
            <div className="ccard" key={f.id}>
              <div className="in">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <h3>{f.label}</h3>
                  <div className="num">
                    <b>{membres.length}</b>
                    <small>parfums</small>
                  </div>
                </div>

                <div style={{ marginTop: 6 }}>
                  {membres.map((p) => (
                    <div className="flav" key={p.id}>
                      {adminImage(p) ? (
                        <img src={adminImage(p)} alt="" />
                      ) : (
                        <div className="ph">Ö</div>
                      )}
                      <div className="grow">
                        <div className="n">
                          {p.flavor_label || <i style={{ opacity: 0.55 }}>{p.name}</i>}
                        </div>
                        <div className="p">
                          {p.price ? euro(p.price) : "prix à définir"}
                          {dispo(p) ? "" : " · épuisé"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icobtn"
                        title="Modifier"
                        onClick={() => ouvrir({ type: "produit", row: p })}
                      >
                        ✎
                      </button>
                    </div>
                  ))}
                  {membres.length === 0 && (
                    <div className="hint">Aucun produit dans cette famille.</div>
                  )}
                </div>

                <div className="foot">
                  <button
                    type="button"
                    className="btn-dark"
                    onClick={() => ouvrir({ type: "famille", row: f })}
                  >
                    ✎ Modifier la famille
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => ouvrir({ type: "ajout-parfum", row: f })}
                  >
                    + Parfum
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="ccard"
          style={{
            border: "2px dashed var(--beige)",
            boxShadow: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={() => ouvrir({ type: "famille", row: null })}
        >
          <div
            className="in"
            style={{
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: 220,
            }}
          >
            <div style={{ fontSize: 30, color: "rgba(41,34,31,.25)" }}>+</div>
            <h3 style={{ marginTop: 8 }}>Nouvelle famille</h3>
            <p className="s" style={{ flex: 0 }}>
              Kaak, Sablé, Baklawa…
            </p>
          </div>
        </button>
      </div>
    </>
  );
}

/** Ramadan & Aïd — les produits qui ne sortent qu'en saison. */
/** Commandes — l'écran existe, la boutique n'enregistre pas encore les commandes. */
export function EcranCommandes() {
  return (
    <>
      <div className="note">
        Les commandes passées en boutique ne sont pas encore enregistrées en base : elles partent
        aujourd'hui par e-mail et par WhatsApp. Cet écran les recevra le jour où le paiement en
        ligne sera branché.
      </div>
      <div className="empty">Aucune commande enregistrée.</div>
    </>
  );
}

/** Liste d'attente — les clientes qui veulent être prévenues. */
export function EcranAttente({ ctx }: { ctx: Contexte }) {
  const { attente, collections } = ctx;
  const nom = (key: string) => collections.find((c) => c.product_key === key)?.label ?? key;

  return (
    <>
      <div className="note">
        Inscriptions pour un produit ou une collection. Les anciennes inscriptions non typées
        restent à vérifier ; les inscriptions dont la sélection a été supprimée sont conservées et
        signalées.
      </div>

      {attente.length === 0 ? (
        <div className="empty">Personne en attente pour l'instant.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Adresse e-mail</th>
                <th>Sélection attendue</th>
                <th>Inscrite le</th>
              </tr>
            </thead>
            <tbody>
              {attente.map((w) => (
                <tr key={w.id}>
                  <td>
                    <b>{w.email}</b>
                  </td>
                  <td>
                    {w.target_type === "product"
                      ? "Produit"
                      : w.target_type === "collection"
                        ? "Collection"
                        : "Ancienne inscription à vérifier"}{" "}
                    : {w.target_label || nom(w.collection)}
                    {w.target_exists === false && <small> — sélection supprimée</small>}
                  </td>
                  <td>
                    {w.created_at
                      ? new Date(w.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
