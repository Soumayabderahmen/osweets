import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Lock, Truck, MapPin, Store, AlertTriangle, CreditCard } from "lucide-react";
import { formatPrice, useShop } from "@/lib/shop-store";
import {
  DELIVERY_CONFIG,
  FULFILLMENT_LABELS,
  cartFulfillment,
  isWithinRadius,
  localDeliveryFee,
  shippingFee,
  type FulfillmentMode,
} from "@/lib/fulfillment";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Commande — Ö' Sweets" }] }),
  component: Page,
});

const MODE_ICON: Record<FulfillmentMode, typeof Truck> = {
  shipping: Truck,
  local: MapPin,
  pickup: Store,
};

function Page() {
  const { cart, cartTotal, clearCart } = useShop();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [payment, setPayment] = useState<"card" | "paypal">("card");

  const ful = useMemo(() => cartFulfillment(cart), [cart]);
  const [mode, setMode] = useState<FulfillmentMode | "">("");
  const [km, setKm] = useState<string>("");

  const distance = Number(km.replace(",", ".")) || 0;
  const tooFar = mode === "local" && km !== "" && !isWithinRadius(distance);

  const fee =
    mode === "shipping"
      ? shippingFee(cartTotal)
      : mode === "local"
        ? localDeliveryFee(distance, cartTotal)
        : 0;

  const canContinueDelivery =
    mode !== "" && (mode !== "local" || (km !== "" && isWithinRadius(distance)));

  if (cart.length === 0 && !done) {
    return (
      <div className="container-os section-y text-center">
        <h1 className="font-display text-3xl">Panier vide</h1>
        <Link to="/patisserie" className="btn btn-gold mt-6 inline-flex">Boutique</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-os section-y text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="font-display text-4xl">Commande confirmée</h1>
        <p className="text-charbon/70 mt-4">Vous recevrez un email de confirmation sous peu.</p>
        <Link to="/" className="btn btn-gold mt-8 inline-flex">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="container-os section-y">
      <h1 className="font-display text-4xl text-center">Finaliser ma commande</h1>
      <div className="mt-8 flex justify-center gap-3 md:gap-8">
        {["Infos", "Réception", "Récap", "Paiement"].map((label, i) => (
          <div key={label} className={`flex items-center gap-2 text-xs uppercase tracking-wider ${step >= i + 1 ? "text-gold" : "text-charbon/40"}`}>
            <span className={`h-7 w-7 rounded-full grid place-items-center text-[11px] ${step >= i + 1 ? "bg-gold text-white" : "border border-charbon/20"}`}>{i + 1}</span>
            <span className="hidden md:inline">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 2 && !canContinueDelivery) return;
            if (step < 4) setStep(step + 1);
            else { clearCart(); setDone(true); }
          }}
          className="bg-white border border-border p-8 space-y-4"
        >
          {step === 1 && (<>
            <h2 className="font-display text-2xl">Vos informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Prénom" className="bg-sable border border-border px-4 py-3" />
              <input required placeholder="Nom" className="bg-sable border border-border px-4 py-3" />
            </div>
            <input required type="email" placeholder="Email" className="w-full bg-sable border border-border px-4 py-3" />
            <input required placeholder="Téléphone" className="w-full bg-sable border border-border px-4 py-3" />
          </>)}

          {step === 2 && (<>
            <h2 className="font-display text-2xl">Mode de réception</h2>

            {ful.message && (
              <div className="flex gap-3 bg-gold/10 border border-gold/40 px-4 py-3 text-sm text-charbon/80">
                <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <span>{ful.message}</span>
              </div>
            )}

            <div className="space-y-3">
              {(["shipping", "local", "pickup"] as FulfillmentMode[]).map((m) => {
                const enabled = ful.available.includes(m);
                const Icon = MODE_ICON[m];
                return (
                  <label
                    key={m}
                    className={`flex items-start gap-3 border px-4 py-3 text-sm ${
                      !enabled
                        ? "border-border bg-sable/60 opacity-55 cursor-not-allowed"
                        : mode === m
                          ? "border-gold bg-beige cursor-pointer"
                          : "border-border bg-white hover:border-gold/50 cursor-pointer"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      className="accent-[var(--gold)] mt-1"
                      disabled={!enabled}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                    />
                    <Icon className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span className="flex-1">
                      <span className="block font-medium">{FULFILLMENT_LABELS[m]}</span>
                      <span className="block text-xs text-charbon/60 mt-0.5">
                        {m === "shipping" &&
                          `Colis 48-72h · ${DELIVERY_CONFIG.freeShippingFrom > 0 ? `offerte dès ${DELIVERY_CONFIG.freeShippingFrom} €, sinon ` : ""}${formatPrice(DELIVERY_CONFIG.shippingFlatFee)}`}
                        {m === "local" &&
                          `Depuis ${DELIVERY_CONFIG.workshopAddress} · ${formatPrice(DELIVERY_CONFIG.baseFee)} + ${DELIVERY_CONFIG.pricePerKm.toFixed(2)} €/km · rayon max ${DELIVERY_CONFIG.maxRadiusKm} km`}
                        {m === "pickup" && "Gratuit · sur rendez-vous à l'atelier"}
                      </span>
                      {!enabled && (
                        <span className="block text-[11px] text-charbon/55 mt-1">
                          {m === "shipping"
                            ? "Indisponible pour ce panier (produits frais / salé / non expédiables)."
                            : "Indisponible pour ce panier."}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {mode === "local" && (
              <div className="space-y-2 pt-2">
                <input
                  required
                  placeholder="Adresse de livraison"
                  className="w-full bg-sable border border-border px-4 py-3"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Code postal" className="bg-sable border border-border px-4 py-3" />
                  <input required placeholder="Ville" className="bg-sable border border-border px-4 py-3" />
                </div>
                <label className="block text-xs uppercase tracking-wider text-charbon/60 pt-2">
                  Distance depuis l'atelier (km)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder={`Ex. 12 (max ${DELIVERY_CONFIG.maxRadiusKm} km)`}
                  className="w-full bg-sable border border-border px-4 py-3"
                />
                {tooFar ? (
                  <p className="text-xs text-destructive">
                    Hors zone de livraison locale (rayon maximal : {DELIVERY_CONFIG.maxRadiusKm} km).
                    Choisissez le retrait à l'atelier.
                  </p>
                ) : (
                  km !== "" && (
                    <p className="text-sm">
                      Frais de livraison locale estimés :{" "}
                      <strong className="text-gold font-price">{formatPrice(fee)}</strong>
                    </p>
                  )
                )}
              </div>
            )}

            {mode === "shipping" && (
              <div className="space-y-2 pt-2">
                <input required placeholder="Adresse d'expédition" className="w-full bg-sable border border-border px-4 py-3" />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Code postal" className="bg-sable border border-border px-4 py-3" />
                  <input required placeholder="Ville" className="bg-sable border border-border px-4 py-3" />
                </div>
              </div>
            )}

            {mode === "pickup" && (
              <p className="text-sm text-charbon/70 bg-sable border border-border px-4 py-3">
                Retrait à {DELIVERY_CONFIG.workshopAddress}. Nous vous contactons pour fixer le créneau.
              </p>
            )}

            <input type="date" className="w-full bg-sable border border-border px-4 py-3" />
            <textarea rows={3} placeholder="Instructions spéciales" className="w-full bg-sable border border-border px-4 py-3" />
          </>)}

          {step === 3 && (<>
            <h2 className="font-display text-2xl">Récapitulatif</h2>
            <ul className="space-y-2 text-sm">
              {cart.map((c) => <li key={c.name + (c.variantId ?? "")} className="flex justify-between"><span>{c.name} × {c.quantity}</span><span>{formatPrice(c.price * c.quantity)}</span></li>)}
            </ul>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span>{mode ? FULFILLMENT_LABELS[mode] : "Mode de réception"}</span>
              <span>{fee === 0 ? "Offerte" : formatPrice(fee)}</span>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-3 border-t border-border">
              <input type="checkbox" className="accent-[var(--gold)]" /> 🎁 C'est un cadeau
            </label>
            <textarea rows={2} placeholder="Note de commande (optionnel)" className="w-full bg-sable border border-border px-4 py-3" />
          </>)}

          {step === 4 && (<>
            <h2 className="font-display text-2xl">Paiement sécurisé</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 border px-4 py-3 text-sm cursor-pointer ${payment === "card" ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}>
                <input type="radio" name="payment" className="accent-[var(--gold)]" checked={payment === "card"} onChange={() => setPayment("card")} />
                <CreditCard className="h-4 w-4 text-gold" />
                <span>Carte bancaire (Visa · Mastercard · CB)</span>
              </label>
              <label className={`flex items-center gap-3 border px-4 py-3 text-sm cursor-pointer ${payment === "paypal" ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}>
                <input type="radio" name="payment" className="accent-[var(--gold)]" checked={payment === "paypal"} onChange={() => setPayment("paypal")} />
                <span className="font-medium text-[#003087]">PayPal</span>
              </label>
            </div>
            <div className="bg-sable p-4 border border-gold/30 text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" /> Paiement 100% sécurisé — carte bancaire et PayPal
            </div>
            <p className="text-xs text-charbon/60">⚠️ Démonstration — le paiement en ligne sera activé sur demande.</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" required className="accent-[var(--gold)]" /> J'accepte les <Link to="/cgv" className="underline text-gold">CGV</Link>
            </label>
          </>)}

          <div className="flex justify-between pt-4">
            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="btn btn-outline-gold">← Retour</button>}
            <button type="submit" disabled={step === 2 && !canContinueDelivery} className="btn btn-gold ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
              {step < 4 ? "Continuer →" : <><Check className="h-4 w-4" /> Confirmer la commande</>}
            </button>
          </div>
        </form>

        <aside className="bg-sable p-6 h-fit space-y-3 text-sm">
          <h3 className="font-display text-lg">Votre commande</h3>
          {cart.map((c) => (
            <div key={c.name + (c.variantId ?? "")} className="flex justify-between">
              <span>{c.name} × {c.quantity}</span><span>{formatPrice(c.price * c.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3">
            <span>{mode ? FULFILLMENT_LABELS[mode] : "Réception (à choisir)"}</span>
            <span>{mode === "" ? "—" : fee === 0 ? "Offerte" : formatPrice(fee)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-display">
            <span>Total</span><span className="text-gold font-price text-xl">{formatPrice(cartTotal + fee)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
