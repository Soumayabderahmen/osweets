import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock, Truck, MapPin, Store, AlertTriangle } from "lucide-react";
import { formatPrice, lineId, useShop, type CartItem } from "@/lib/shop-store";
import { cartPackaging } from "@/lib/variant-label";
import { useCatalog, useEtatBase } from "@/lib/catalog";
import { FULFILLMENT_LABELS, cartFulfillment, type FulfillmentMode } from "@/lib/fulfillment";
import { localDeliveryPrice, shippingPrice } from "@/api/settings";
import { useShopSettings } from "@/components/layout/HolidayBanner";
import { cartHasBlockingIssue, lineUnitPrice } from "@/lib/cart-rules";
import { applyCartValidation, useCartValidation } from "@/lib/use-cart-validation";
import { formatDateFr, validateFulfillmentDate } from "@/lib/checkout-date";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { etape?: number } => ({
    etape:
      search.etape === undefined
        ? undefined
        : Math.min(4, Math.max(1, Math.trunc(Number(search.etape) || 1))),
  }),
  head: () => ({ meta: [{ title: "Commande — Ö' Sweets" }] }),
  component: Page,
});

const MODE_ICON: Record<FulfillmentMode, typeof Truck> = {
  shipping: Truck,
  local: MapPin,
  pickup: Store,
};

const CHECKOUT_DRAFT_KEY = "osweets-checkout-draft-v1";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  address2: "",
  postalCode: "",
  city: "",
  country: "France",
  billingSame: true,
  billingAddress: "",
  billingPostalCode: "",
  billingCity: "",
  instructions: "",
  date: "",
  note: "",
};

type CheckoutForm = typeof EMPTY_FORM;

type CheckoutDraft = {
  form: CheckoutForm;
  mode: FulfillmentMode | "";
  km: string;
  step?: number;
};

function readCheckoutDraft(): CheckoutDraft {
  if (typeof window === "undefined") return { form: EMPTY_FORM, mode: "", km: "" };
  try {
    const raw =
      window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY) ??
      window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return { form: EMPTY_FORM, mode: "", km: "" };
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>;
    return {
      form: { ...EMPTY_FORM, ...(parsed.form ?? {}) },
      mode: parsed.mode ?? "",
      km: parsed.km ?? "",
      step: parsed.step,
    };
  } catch {
    return { form: EMPTY_FORM, mode: "", km: "" };
  }
}

function Page() {
  const { cart, cartTotal, giftTotal, clearCart, replaceCart, removeFromCart, updateQty } =
    useShop();
  const validation = useCartValidation();
  /*
   * Les tarifs viennent des Réglages, plus d'une constante du code. C'est
   * la même source que l'écran back-office : ce qui y est saisi est
   * exactement ce que la cliente paie.
   */
  const reglages = useShopSettings();
  const navigate = Route.useNavigate();
  const step = Route.useSearch().etape ?? 1;
  const setStep = (etape: number) => void navigate({ search: { etape } });
  const [hydrated, setHydrated] = useState(false);
  const submitting = useRef(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [done, setDone] = useState(false);
  // On garde une copie des lignes : le panier est vidé à la validation, mais la
  // confirmation doit afficher le même détail de conditionnement que le récap.
  const [ordered, setOrdered] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);

  // Le catalogue vient de la base : sans lui, une pâtisserie au panier serait
  // ignorée et les règles d'expédition calculées sur un panier vide.
  const catalogue = useCatalog();
  const etatBase = useEtatBase();
  const ful = useMemo(() => cartFulfillment(cart, catalogue), [cart, catalogue]);
  const [mode, setMode] = useState<FulfillmentMode | "">("");

  /*
   * Le catalogue arrive après le premier rendu : un mode choisi avant sa
   * réponse peut devenir impossible. On le relâche, sinon la cliente
   * continuerait avec un mode que le panier ne permet plus.
   */
  useEffect(() => {
    if (hydrated && etatBase === "ok" && mode !== "" && !ful.available.includes(mode)) setMode("");
  }, [ful.available, mode, hydrated, etatBase]);
  const [km, setKm] = useState<string>("");
  useEffect(() => {
    const draft = readCheckoutDraft();
    setForm(draft.form);
    setMode(draft.mode);
    setKm(draft.km);
    if (draft.step && !new URLSearchParams(window.location.search).has("etape")) {
      void navigate({ search: { etape: Math.min(4, Math.max(1, draft.step)) }, replace: true });
    }
    setHydrated(true);
    // Restore only once; subsequent history navigation controls the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!hydrated || done) return;
    try {
      window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ form, mode, km, step }));
      window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
      /* The form remains usable when storage is disabled. */
    }
  }, [done, form, km, mode, step, hydrated]);

  const distance = Number(km.replace(",", ".")) || 0;
  // Le sous-total marchandise sert de base aux seuils de gratuité :
  // l'emballage cadeau ne doit pas faire basculer une commande au-dessus.
  const locale = localDeliveryPrice(reglages, distance, cartTotal);
  const colis = shippingPrice(reglages, cartTotal);
  const dansLeRayon = distance > 0 && locale.available;
  const tooFar = mode === "local" && km !== "" && !dansLeRayon;

  const fee = mode === "shipping" ? colis.price : mode === "local" ? locale.price : 0;
  const total = cartTotal + giftTotal + fee;
  const dateOptions = useMemo(
    () => ({
      settings: reglages,
      prepLeads: cart.map(
        (item) => catalogue.find((p) => p.slug === item.slug)?.prepLead ?? item.prepLead,
      ),
    }),
    [cart, catalogue, reglages],
  );
  const dateValidation = validateFulfillmentDate(form.date, dateOptions);
  const minFulfillmentDate = dateValidation.min;

  const canContinueDelivery =
    mode !== "" && (mode !== "local" || (km !== "" && dansLeRayon)) && dateValidation.ok;
  const allGiftWrapped = cart.length > 0 && cart.every((item) => item.gift?.wrap);

  useEffect(() => {
    if (cart.length === 0 || done) return;
    void validation.refresh();
    // On veut une reverification a l'entree et lors du passage d'etape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (cart.length === 0 && !done) {
    return (
      <div className="container-os section-y text-center">
        <h1 className="font-display text-3xl">Panier vide</h1>
        <Link to="/patisserie" className="btn btn-gold mt-6 inline-flex">
          Boutique
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-os section-y text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="font-display text-4xl">Commande confirmée</h1>
        <p className="text-charbon/70 mt-4">Vous recevrez un email de confirmation sous peu.</p>
        {ordered.length > 0 && (
          <ul
            data-testid="confirmation-lines"
            className="mx-auto mt-8 max-w-md space-y-2 border border-border bg-white p-6 text-left text-sm"
          >
            {ordered.map((c) => (
              <li key={c.name + (c.variantId ?? "")} className="flex justify-between gap-4">
                <span>
                  {c.name} × {c.quantity}
                  {cartPackaging(c) && (
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-charbon/55">
                      {cartPackaging(c)}
                    </span>
                  )}
                </span>
                <span>{formatPrice(lineUnitPrice(c) * c.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/" className="btn btn-gold mt-8 inline-flex">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="container-os section-y">
      <h1 className="font-display text-4xl text-center">Finaliser ma commande</h1>
      <div className="mt-8 flex justify-center gap-3 md:gap-8">
        {["Infos", "Réception", "Récap", "Validation"].map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 text-xs uppercase tracking-wider ${step >= i + 1 ? "text-gold" : "text-charbon/40"}`}
          >
            <span
              className={`h-7 w-7 rounded-full grid place-items-center text-[11px] ${step >= i + 1 ? "bg-gold text-white" : "border border-charbon/20"}`}
            >
              {i + 1}
            </span>
            <span className="hidden md:inline">{label}</span>
          </div>
        ))}
      </div>

      {(validation.checking || validation.messages.length > 0) && (
        <div className="mx-auto mt-8 max-w-3xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm leading-relaxed text-charbon/75">
          {validation.checking ? (
            <p>Vérification du panier...</p>
          ) : (
            validation.messages.map((message) => <p key={message}>{message}</p>)
          )}
        </div>
      )}

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (submitting.current) return;
            submitting.current = true;
            setSubmitBusy(true);
            void (async () => {
              try {
                const checked = await validation.refresh();
                const checkedCart = applyCartValidation(cart, checked);
                if (!checked.ok || checked.blocking || cartHasBlockingIssue(checkedCart)) return;
                if (step === 2 && !canContinueDelivery) return;
                if (step < 4) setStep(step + 1);
                else {
                  setOrdered(checkedCart);
                  clearCart();
                  if (typeof window !== "undefined")
                    window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
                  setDone(true);
                }
              } finally {
                submitting.current = false;
                setSubmitBusy(false);
              }
            })();
          }}
          className="bg-white border border-border p-8 space-y-4"
        >
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl">Vos informations</h2>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  placeholder="Prénom"
                  className="bg-sable border border-border px-4 py-3"
                />
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  placeholder="Nom"
                  className="bg-sable border border-border px-4 py-3"
                />
              </div>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="Email"
                className="w-full bg-sable border border-border px-4 py-3"
              />
              <input
                required
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Téléphone"
                className="w-full bg-sable border border-border px-4 py-3"
              />
            </>
          )}

          {step === 2 && (
            <>
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
                            `${reglages.shippingDelay} · ${reglages.shippingFreeFrom > 0 ? `offerte dès ${reglages.shippingFreeFrom} €, sinon ` : ""}${formatPrice(reglages.shippingPrice)}`}
                          {m === "local" &&
                            `Depuis ${reglages.workshopAddress} · ${formatPrice(reglages.deliveryStart)} + ${reglages.deliveryPerKm.toFixed(2).replace(".", ",")} €/km · rayon max ${reglages.deliveryRadiusKm} km`}
                          {m === "pickup" && `Gratuit · ${reglages.pickupDelay.toLowerCase()}`}
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
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Adresse de livraison"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <input
                    value={form.address2}
                    onChange={(e) => setField("address2", e.target.value)}
                    placeholder="Complément d'adresse"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      placeholder="Code postal"
                      className="bg-sable border border-border px-4 py-3"
                    />
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Ville"
                      className="bg-sable border border-border px-4 py-3"
                    />
                  </div>
                  <input
                    required
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    placeholder="Pays"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <label className="block text-xs uppercase tracking-wider text-charbon/60 pt-2">
                    Distance estimée depuis l'atelier (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder={`Ex. 12 (max ${reglages.deliveryRadiusKm} km)`}
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  {tooFar ? (
                    <p className="text-xs text-destructive">
                      Hors zone de livraison locale (rayon maximal : {reglages.deliveryRadiusKm}{" "}
                      km). Choisissez le retrait à l'atelier.
                    </p>
                  ) : (
                    km !== "" && (
                      <p className="text-sm">
                        Frais de livraison locale estimés, à confirmer par l'atelier :{" "}
                        <strong className="text-gold font-price">{formatPrice(fee)}</strong>
                      </p>
                    )
                  )}
                </div>
              )}

              {mode === "shipping" && (
                <div className="space-y-2 pt-2">
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Adresse d'expédition"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <input
                    value={form.address2}
                    onChange={(e) => setField("address2", e.target.value)}
                    placeholder="Complément d'adresse"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      placeholder="Code postal"
                      className="bg-sable border border-border px-4 py-3"
                    />
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Ville"
                      className="bg-sable border border-border px-4 py-3"
                    />
                  </div>
                  <input
                    required
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    placeholder="Pays"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                </div>
              )}

              {mode === "pickup" && (
                <p className="text-sm text-charbon/70 bg-sable border border-border px-4 py-3">
                  Retrait à {reglages.workshopAddress}. Nous vous contactons pour fixer le créneau.
                </p>
              )}

              <label
                htmlFor="checkout-date"
                className="block text-xs uppercase tracking-[0.2em] text-charbon/60"
              >
                {mode === "pickup" ? "Date de retrait" : "Date de réception souhaitée"}
              </label>
              <input
                id="checkout-date"
                type="date"
                required
                min={minFulfillmentDate}
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="w-full bg-sable border border-border px-4 py-3"
              />
              {!dateValidation.ok && form.date && (
                <p className="text-xs text-destructive">{dateValidation.message}</p>
              )}
              {!form.date && (
                <p className="text-xs text-charbon/60">
                  Fait à la commande : première date possible le {formatDateFr(minFulfillmentDate)}.
                </p>
              )}
              <textarea
                rows={3}
                value={form.instructions}
                onChange={(e) => setField("instructions", e.target.value)}
                placeholder="Instructions spéciales"
                className="w-full bg-sable border border-border px-4 py-3"
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-2xl">Récapitulatif</h2>
              <ul className="space-y-2 text-sm">
                {cart.map((c) => (
                  <li key={c.name + (c.variantId ?? "")} className="flex justify-between gap-4">
                    <span>
                      {c.name} × {c.quantity}
                      {cartPackaging(c) && (
                        <span className="block text-[11px] uppercase tracking-[0.16em] text-charbon/55">
                          {cartPackaging(c)}
                        </span>
                      )}
                    </span>
                    <span>{formatPrice(lineUnitPrice(c) * c.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span>{mode ? FULFILLMENT_LABELS[mode] : "Mode de réception"}</span>
                <span>{fee === 0 ? "Offerte" : formatPrice(fee)}</span>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-3 border-t border-border">
                <input
                  type="checkbox"
                  checked={allGiftWrapped}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    replaceCart((prev) =>
                      prev.map((item) => ({
                        ...item,
                        gift: checked
                          ? { ...item.gift, wrap: true }
                          : item.gift?.message
                            ? { message: item.gift.message }
                            : undefined,
                      })),
                    );
                  }}
                  className="accent-[var(--gold)]"
                />{" "}
                Emballage cadeau : {formatPrice(reglages.giftWrapPrice)} par ligne, soit{" "}
                {formatPrice(cart.length * reglages.giftWrapPrice)} pour tout le panier, quelle que
                soit la quantité par ligne.
              </label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Note de commande (optionnel)"
                className="w-full bg-sable border border-border px-4 py-3"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-3 border-t border-border">
                <input
                  type="checkbox"
                  checked={form.billingSame}
                  onChange={(e) => setField("billingSame", e.target.checked)}
                  className="accent-[var(--gold)]"
                />{" "}
                Adresse de facturation identique
              </label>
              {!form.billingSame && (
                <div className="space-y-2">
                  <input
                    value={form.billingAddress}
                    onChange={(e) => setField("billingAddress", e.target.value)}
                    required
                    placeholder="Adresse de facturation"
                    className="w-full bg-sable border border-border px-4 py-3"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.billingPostalCode}
                      onChange={(e) => setField("billingPostalCode", e.target.value)}
                      required
                      placeholder="Code postal"
                      className="bg-sable border border-border px-4 py-3"
                    />
                    <input
                      value={form.billingCity}
                      onChange={(e) => setField("billingCity", e.target.value)}
                      required
                      placeholder="Ville"
                      className="bg-sable border border-border px-4 py-3"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-2xl">Validation de la commande</h2>
              {/*
              Tant que rien n'encaisse, on ne promet pas de « paiement
              sécurisé ». On dit à la cliente ce qui se passe, dans ses mots
              à elle : pas de paiement maintenant, l'atelier confirme d'abord.
              (L'ancienne phrase parlait de « commandes serveur » et de
              « phase séparée » — du vocabulaire de développeur.)
            */}
              <div className="bg-sable p-4 border border-gold/30 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-gold" />
                Aucun paiement ne vous est demandé maintenant.
              </div>
              <p className="text-xs text-charbon/60">
                L'atelier vérifie votre commande et vous confirme la date avant de la préparer. Les
                prix et la disponibilité sont revérifiés au moment de valider.
              </p>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" required className="h-5 w-5 accent-[var(--gold)]" />{" "}
                J'accepte les{" "}
                <Link to="/cgv" className="underline text-gold">
                  CGV
                </Link>
              </label>
            </>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn btn-outline-gold"
              >
                ← Retour
              </button>
            )}
            <button
              type="submit"
              disabled={
                submitBusy ||
                validation.checking ||
                validation.blocking ||
                (step === 2 && !canContinueDelivery)
              }
              className="btn btn-gold ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step < 4 ? (
                "Continuer →"
              ) : (
                <>
                  <Check className="h-4 w-4" /> Valider le récapitulatif
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="bg-sable p-6 h-fit space-y-3 text-sm">
          <h3 className="font-display text-lg">Votre commande</h3>
          {cart.map((c) => (
            <div
              key={lineId(c)}
              className="flex flex-wrap justify-between gap-4 border-b border-border pb-3"
            >
              <span>
                {c.name} × {c.quantity}
                {cartPackaging(c) && (
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-charbon/55">
                    {cartPackaging(c)}
                  </span>
                )}
              </span>
              <span>{formatPrice(lineUnitPrice(c) * c.quantity)}</span>
              <div className="w-full flex items-center gap-1">
                {/* Cibles de 40 px : au doigt, un « − » de 9 px se rate. */}
                <button
                  type="button"
                  aria-label={`Diminuer ${c.name}`}
                  onClick={() => updateQty(lineId(c), c.quantity - 1)}
                  className="grid h-10 w-10 place-items-center border border-border hover:bg-sable"
                >
                  −
                </button>
                <span className="w-8 text-center">{c.quantity}</span>
                <button
                  type="button"
                  aria-label={`Augmenter ${c.name}`}
                  onClick={() => updateQty(lineId(c), c.quantity + 1)}
                  className="grid h-10 w-10 place-items-center border border-border hover:bg-sable"
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-auto min-h-10 px-2 underline"
                  onClick={() => removeFromCart(lineId(c))}
                >
                  Retirer
                </button>
              </div>
              {(c.validationStatus?.message || ful.unknown.includes(c.slug)) && (
                <p className="w-full text-destructive" role="status">
                  {c.validationStatus?.message ??
                    `${c.name} n'est plus disponible. Retirez cette ligne pour continuer.`}
                </p>
              )}
            </div>
          ))}
          {giftTotal > 0 && (
            <div className="flex justify-between border-t border-border pt-3">
              <span>Emballage cadeau</span>
              <span>{formatPrice(giftTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3">
            <span>{mode ? FULFILLMENT_LABELS[mode] : "Réception (à choisir)"}</span>
            <span>{mode === "" ? "—" : fee === 0 ? "Offerte" : formatPrice(fee)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-display">
            <span>Total</span>
            <span className="text-gold font-price text-xl">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
