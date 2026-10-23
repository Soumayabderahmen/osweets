import { useState } from "react";
import { toast } from "sonner";
import { saveSettings, type ShopSettings } from "@/api/settings";
import { euro, type Contexte } from "./core";

/**
 * Réglages — ce qu'on change deux ou trois fois par an, mais qu'il faut
 * pouvoir changer sans appeler personne.
 *
 * Le calcul de livraison est montré plutôt qu'expliqué : c'est la seule façon
 * de vérifier un tarif sans sortir la calculatrice.
 */
export function EcranReglages({ ctx }: { ctx: Contexte }) {
  const [s, setS] = useState<ShopSettings>(ctx.reglages);
  const [testKm, setTestKm] = useState(12);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));
  const nombre = (k: keyof ShopSettings, v: string) =>
    set(k, (Number(String(v).replace(",", ".")) || 0) as never);

  const enregistrer = async (patch?: Partial<Record<string, string>>) => {
    setBusy(true);
    try {
      const suite = await saveSettings({
        data: {
          values: {
            delivery_start: String(s.deliveryStart),
            delivery_per_km: String(s.deliveryPerKm),
            delivery_radius_km: String(s.deliveryRadiusKm),
            delivery_free_from: String(s.deliveryFreeFrom),
            shipping_price: String(s.shippingPrice),
            shipping_free_from: String(s.shippingFreeFrom),
            holiday_mode: s.holidayMode ? "on" : "off",
            holiday_from: s.holidayFrom,
            holiday_until: s.holidayUntil,
            gift_wrap_price: String(s.giftWrapPrice),
            workshop_address: s.workshopAddress,
            shipping_delay: s.shippingDelay,
            pickup_delay: s.pickupDelay,
            ...patch,
          },
        },
      });
      setS(suite);
      await ctx.recharger();
      toast.success("Réglages enregistrés.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  const tropLoin = testKm > s.deliveryRadiusKm;
  const total = s.deliveryStart + s.deliveryPerKm * testKm;

  return (
    <>
      <div className="note">
        Ce qu'on change deux ou trois fois par an — mais qu'il faut pouvoir changer{" "}
        <b>sans appeler personne</b>.
      </div>

      <div className="cols2">
        {/* ------------------------- livraison ------------------------- */}
        <div className="card">
          <h3>Livraison &amp; retrait</h3>
          <div className="sub">Ce que la cliente paie pour recevoir sa commande.</div>

          <div className="subh">Vous la livrez</div>
          <div className="two">
            <label className="f">
              <span>Prix de départ (€)</span>
              <input value={s.deliveryStart} onChange={(e) => nombre("deliveryStart", e.target.value)} />
            </label>
            <label className="f">
              <span>Par kilomètre (€)</span>
              <input value={s.deliveryPerKm} onChange={(e) => nombre("deliveryPerKm", e.target.value)} />
            </label>
          </div>
          <div className="two">
            <label className="f">
              <span>Vous livrez jusqu'à (km)</span>
              <input value={s.deliveryRadiusKm} onChange={(e) => nombre("deliveryRadiusKm", e.target.value)} />
            </label>
            <label className="f">
              <span>Offerte à partir de (€)</span>
              <input value={s.deliveryFreeFrom} onChange={(e) => nombre("deliveryFreeFrom", e.target.value)} />
            </label>
          </div>

          <div className="calc">
            <div className="q">
              Pour vérifier : une cliente à
              <input value={testKm} onChange={(e) => setTestKm(Number(e.target.value) || 0)} />
              km de l'atelier paierait…
            </div>
            {tropLoin ? (
              <>
                <div className="l">
                  <span>
                    Elle est à {testKm} km, vous livrez jusqu'à {s.deliveryRadiusKm} km.
                  </span>
                </div>
                <div className="l tot">
                  <span>Pas de livraison possible</span>
                  <b>retrait ou colis</b>
                </div>
              </>
            ) : (
              <>
                <div className="l">
                  <span>Au départ — la part fixe</span>
                  <b>{euro(s.deliveryStart)}</b>
                </div>
                <div className="l">
                  <span>
                    {testKm} km × {s.deliveryPerKm.toFixed(2).replace(".", ",")} € — la distance
                  </span>
                  <b>+ {euro(s.deliveryPerKm * testKm)}</b>
                </div>
                <div className="l tot">
                  <span>Elle paie</span>
                  <b>{euro(total)}</b>
                </div>
                <div className="l">
                  <span style={{ fontSize: 11.5, opacity: 0.65 }}>
                    …et rien du tout si sa commande dépasse {s.deliveryFreeFrom} €.
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="subh">Vous envoyez un colis</div>
          <div className="two">
            <label className="f">
              <span>Prix du colis (€)</span>
              <input value={s.shippingPrice} onChange={(e) => nombre("shippingPrice", e.target.value)} />
            </label>
            <label className="f">
              <span>Offert à partir de (€)</span>
              <input value={s.shippingFreeFrom} onChange={(e) => nombre("shippingFreeFrom", e.target.value)} />
            </label>
          </div>

          <div className="subh">Elle vient chercher</div>
          <div className="hint" style={{ marginTop: 0 }}>
            Le retrait à l'atelier est toujours gratuit.
          </div>

          <div className="foot" style={{ marginTop: 18 }}>
            <button type="button" className="btn-dark" disabled={busy} onClick={() => void enregistrer()}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* -------------------------- vacances -------------------------- */}
        <div className="card">
          <h3>Vacances &amp; fermeture</h3>
          <div className="sub">Un seul interrupteur pour suspendre toutes les commandes.</div>

          <div className="segs" style={{ marginTop: 14 }}>
            <button
              type="button"
              className={!s.holidayMode ? "on gold" : ""}
              disabled={busy}
              onClick={() => {
                setS((p) => ({ ...p, holidayMode: false }));
                void enregistrer({ holiday_mode: "off" });
              }}
            >
              Boutique ouverte
            </button>
            <button
              type="button"
              className={s.holidayMode ? "on dark" : ""}
              disabled={busy}
              onClick={() => {
                setS((p) => ({ ...p, holidayMode: true }));
                void enregistrer({ holiday_mode: "on" });
              }}
            >
              Je pars — commandes suspendues
            </button>
          </div>

          <div className="two" style={{ marginTop: 14 }}>
            <label className="f">
              <span>Fermée à partir du</span>
              <input
                value={s.holidayFrom}
                placeholder="12 août"
                onChange={(e) => set("holidayFrom", e.target.value)}
              />
            </label>
            <label className="f">
              <span>Réouverture le</span>
              <input
                value={s.holidayUntil}
                placeholder="26 août"
                onChange={(e) => set("holidayUntil", e.target.value)}
              />
            </label>
          </div>

          <div className="livex" style={{ marginTop: 12 }}>
            {s.holidayMode ? (
              <>
                La cliente verra ce bandeau en haut de chaque page :
                <br />
                <b>
                  « Atelier fermé
                  {s.holidayFrom && s.holidayUntil
                    ? ` du ${s.holidayFrom} au ${s.holidayUntil}`
                    : s.holidayUntil
                      ? ` jusqu'au ${s.holidayUntil}`
                      : s.holidayFrom
                        ? ` à partir du ${s.holidayFrom}`
                        : ""}
                  . Vous pouvez parcourir la boutique ; les commandes rouvrent
                  {s.holidayUntil ? ` le ${s.holidayUntil}` : " très vite"}. »
                </b>
              </>
            ) : (
              "Boutique ouverte. Les commandes suivent le stock de chaque produit."
            )}
          </div>

          <div className="hint">
            Vos quantités ne sont pas touchées : à la réouverture, chaque produit retrouve exactement
            son stock. La boutique reste consultable — la cliente voit vos produits et vos photos,
            elle ne peut simplement pas commander.
          </div>

          <div className="foot" style={{ marginTop: 18 }}>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void enregistrer()}>
              Enregistrer les dates
            </button>
          </div>
        </div>

        {/* ------------------- emballage cadeau ------------------- */}
        <div className="card">
          <h3>Emballage cadeau</h3>
          <div className="sub">
            Le supplément est ajouté au total de la commande, pas seulement affiché.
          </div>

          <div className="two" style={{ marginTop: 14 }}>
            <label className="f">
              <span>Supplément par article (€)</span>
              <input
                value={s.giftWrapPrice}
                onChange={(e) => nombre("giftWrapPrice", e.target.value)}
              />
            </label>
          </div>

          <div className="livex" style={{ marginTop: 12 }}>
            La cliente lira <b>« Emballage cadeau + {euro(s.giftWrapPrice)} »</b> sur la fiche
            produit, et retrouvera cette ligne dans son panier.
          </div>
          <div className="hint">
            Mettez <b>0</b> pour offrir l'emballage : la case reste proposée, sans supplément.
          </div>

          <div className="foot" style={{ marginTop: 18 }}>
            <button type="button" className="btn-dark" disabled={busy} onClick={() => void enregistrer()}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* ------------- ce qu'on promet à la cliente ------------- */}
        <div className="card">
          <h3>Ce que la boutique promet</h3>
          <div className="sub">
            Ces phrases s'affichent sur chaque fiche produit et au moment de payer. Elles n'engagent
            que vous : écrivez ce que l'atelier tient vraiment.
          </div>

          <label className="f" style={{ marginTop: 14 }}>
            <span>Adresse du retrait</span>
            <input
              value={s.workshopAddress}
              placeholder="Atelier Ö' Sweets — Évry-Courcouronnes (91)"
              onChange={(e) => set("workshopAddress", e.target.value)}
            />
          </label>

          <div className="two" style={{ marginTop: 12 }}>
            <label className="f">
              <span>Délai annoncé pour un colis</span>
              <input
                value={s.shippingDelay}
                placeholder="Colis 48-72h"
                onChange={(e) => set("shippingDelay", e.target.value)}
              />
            </label>
            <label className="f">
              <span>Modalité de retrait</span>
              <input
                value={s.pickupDelay}
                placeholder="Sur rendez-vous à l'atelier"
                onChange={(e) => set("pickupDelay", e.target.value)}
              />
            </label>
          </div>

          <div className="hint">
            La boutique n'annonce plus « Retrait boutique 2h » : elle répète exactement ce qui est
            écrit ici. Une promesse fausse coûte plus cher qu'une promesse modeste.
          </div>

          <div className="foot" style={{ marginTop: 18 }}>
            <button type="button" className="btn-dark" disabled={busy} onClick={() => void enregistrer()}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
