import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, Trash2, Gift, Copy, Check, Share2 } from "lucide-react";
import { formatPrice, lineId, useShop } from "@/lib/shop-store";
import { cartPackaging } from "@/lib/variant-label";
import { useShopSettings } from "@/components/layout/HolidayBanner";
import { shippingPrice } from "@/api/settings";
import { getReferralCode } from "@/lib/referral";
import { lineUnitPrice, priceLockNotice } from "@/lib/cart-rules";
import { useCartValidation } from "@/lib/use-cart-validation";

export const Route = createFileRoute("/panier")({
  head: () => ({ meta: [{ title: "Mon Panier — Ö' Sweets" }] }),
  component: Page,
});

/**
 * Le code de parrainage.
 *
 * Il était tiré au sort ici, sous une clé de stockage à part — « OSW-XXXX »
 * au rendu serveur, un vrai code au rendu navigateur. React voyait deux
 * textes différents et reconstruisait toute la page ; et le code affiché
 * n'était pas celui que `lib/referral` gère par ailleurs.
 *
 * On le lit donc après le montage, dans la seule maison qui le tient.
 */
function ReferralBlock() {
  const [code, setCode] = useState<string | null>(null);
  const [origine, setOrigine] = useState("https://osweets.fr");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setCode(getReferralCode());
    setOrigine(window.location.origin);
  }, []);

  const affiche = code ?? "————";
  const link = `${origine}/?ref=${code ?? ""}`;
  const msg = encodeURIComponent(
    `Découvre Ö' Sweets Pâtisserie ! Profite de -10% avec mon code ${affiche} : ${link}`,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le bouton reste simplement sans confirmation si le presse-papiers est bloqué.
    }
  };

  return (
    <div className="mt-12 bg-gradient-to-br from-beige to-sable border border-gold/30 p-5 sm:p-8 md:p-10">
      <div className="flex items-start gap-4">
        <div className="hidden sm:grid h-12 w-12 rounded-full bg-gold/15 place-items-center shrink-0">
          <Gift className="h-6 w-6 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium">
            Programme de fidélité
          </div>
          <h3 className="font-display text-2xl md:text-3xl mt-2">
            Parrainez vos proches, recevez 10%
          </h3>
          <p className="mt-3 text-charbon/70 font-light leading-relaxed">
            Partagez votre code unique. Pour chaque ami qui passe commande, vous recevez 10% de
            remise sur votre prochaine commande, et votre filleul aussi.
          </p>

          <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-3">
            <div className="bg-white border-2 border-dashed border-gold px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-charbon/50">
                  Votre code
                </div>
                <div className="font-price text-2xl text-gold mt-0.5">{affiche}</div>
              </div>
              <button
                onClick={copy}
                className="grid h-11 w-11 shrink-0 place-items-center text-gold hover:text-charbon transition"
                aria-label="Copier"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${msg}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold flex-1 justify-center"
              >
                <Share2 className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href={`mailto:?subject=Ö' Sweets - 10% pour toi&body=${msg}`}
                className="btn btn-outline-gold flex-1 justify-center sm:flex-none"
              >
                Email
              </a>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-charbon/55">
            Remise validée à la commande de votre filleul. Cumulable avec un seul code à la fois.
          </p>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const { cart, updateQty, removeFromCart, cartTotal, giftTotal } = useShop();
  const validation = useCartValidation();
  const [validated, setValidated] = useState(false);
  const reglages = useShopSettings();
  /*
   * La livraison ne se décide pas ici.
   *
   * Le panier la calculait tout seul — 9,90 € au-dessus de 80 €, offerte
   * en dessous —, deux nombres écrits dans ce fichier que les Réglages
   * ignoraient. Pire : il facturait un colis à une cliente qui allait
   * peut-être choisir le retrait, gratuit. Le mode de réception se choisit
   * à l'étape suivante ; le panier annonce donc le tarif du colis sans
   * l'ajouter, et le total reste celui des articles.
   */
  const colis = useMemo(() => shippingPrice(reglages, cartTotal), [cartTotal, reglages]);
  const total = cartTotal + giftTotal;

  useEffect(() => {
    if (validated || cart.length === 0) return;
    setValidated(true);
    void validation.refresh();
  }, [cart.length, validated, validation]);

  if (cart.length === 0) {
    return (
      <div className="container-os section-y text-center">
        <h1 className="font-display text-4xl">Votre panier est vide</h1>
        <p className="text-charbon/60 mt-3">Nos pâtisseries vous attendent.</p>
        <Link to="/patisserie" className="btn btn-gold mt-8 inline-flex">
          Découvrir la boutique
        </Link>
        <div className="max-w-2xl mx-auto">
          <ReferralBlock />
        </div>
      </div>
    );
  }

  return (
    <div className="container-os section-y">
      <h1 className="font-display text-4xl md:text-5xl text-center">Mon panier</h1>
      {(validation.checking || validation.messages.length > 0) && (
        <div className="mx-auto mt-8 max-w-3xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm leading-relaxed text-charbon/75">
          {validation.checking ? (
            <p>Vérification du panier...</p>
          ) : (
            validation.messages.map((message) => <p key={message}>{message}</p>)
          )}
        </div>
      )}
      <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          {cart.map((it) => (
            <div key={lineId(it)} className="flex gap-4 bg-white border border-border p-4">
              <img src={it.image} alt={it.name} className="h-24 w-24 object-cover" />
              <div className="flex-1">
                <div className="font-display text-lg">{it.name}</div>
                {/* Conditionnement retenu : format (pot, bol, 12 personnes) ou grammage (500 g / 1 kg). */}
                {cartPackaging(it) && (
                  <div
                    data-testid="cart-packaging"
                    className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-charbon/55"
                  >
                    {cartPackaging(it)}
                  </div>
                )}
                <div className="font-price text-gold mt-1">{formatPrice(lineUnitPrice(it))}</div>
                <p className="mt-2 text-xs text-charbon/60">{priceLockNotice(it)}</p>
                {it.validationStatus?.message && (
                  <div
                    className={`mt-2 text-xs ${
                      it.validationStatus.blocking ? "text-destructive" : "text-charbon/60"
                    }`}
                  >
                    {it.validationStatus.message}
                  </div>
                )}
                <div className="mt-3 inline-flex items-center border border-charbon">
                  <button
                    onClick={() => updateQty(lineId(it), it.quantity - 1)}
                    aria-label={`Diminuer la quantité de ${it.name}`}
                    className="h-9 w-9 grid place-items-center hover:bg-sable"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center">{it.quantity}</span>
                  <button
                    onClick={() => updateQty(lineId(it), it.quantity + 1)}
                    aria-label={`Augmenter la quantité de ${it.name}`}
                    disabled={it.stockUnlimited === false && it.quantity >= (it.stockQty ?? 0)}
                    className="h-9 w-9 grid place-items-center hover:bg-sable disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-price text-lg">
                  {formatPrice(lineUnitPrice(it) * it.quantity)}
                </div>
                <button
                  onClick={() => removeFromCart(lineId(it))}
                  className="text-charbon/40 hover:text-destructive mt-3"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-sable p-6 h-fit sticky top-32 space-y-4">
          <h3 className="font-display text-xl">Récapitulatif</h3>
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          {giftTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Emballage cadeau</span>
              <span>{formatPrice(giftTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Réception</span>
            <span className="text-charbon/60">à choisir à l'étape suivante</span>
          </div>
          <p className="text-[11px] leading-relaxed text-charbon/55">
            Retrait à l'atelier : gratuit. {reglages.shippingDelay} :{" "}
            {colis.free
              ? "offert pour cette commande"
              : `${formatPrice(reglages.shippingPrice)}${
                  reglages.shippingFreeFrom > 0
                    ? `, offert dès ${formatPrice(reglages.shippingFreeFrom)}`
                    : ""
                }`}
            .
          </p>
          <div className="border-t border-border pt-4 flex justify-between font-display text-lg">
            <span>Total</span>
            <span className="text-gold font-price text-2xl">{formatPrice(total)}</span>
          </div>
          <input
            placeholder="Code promo / fidélité"
            className="w-full bg-white border border-border px-3 py-2 text-sm"
          />
          {validation.blocking ? (
            <button
              type="button"
              disabled
              className="btn btn-gold w-full justify-center opacity-50 cursor-not-allowed"
            >
              Corrigez le panier
            </button>
          ) : (
            <Link to="/checkout" className="btn btn-gold w-full justify-center">
              Procéder au paiement
            </Link>
          )}
          <Link
            to="/patisserie"
            className="block text-center text-xs uppercase tracking-wider text-charbon/60 hover:text-gold"
          >
            Continuer mes achats
          </Link>
        </aside>
      </div>

      <ReferralBlock />
    </div>
  );
}
