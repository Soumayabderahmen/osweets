import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Gift, Copy, Check, Share2 } from "lucide-react";
import { formatPrice, lineId, useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/panier")({
  head: () => ({ meta: [{ title: "Mon Panier — Ö' Sweets" }] }),
  component: Page,
});

function getReferralCode(): string {
  if (typeof window === "undefined") return "OSW-XXXX";
  const key = "osw-referral-code";
  let code = localStorage.getItem(key);
  if (!code) {
    code = "OSW-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem(key, code);
  }
  return code;
}

function ReferralBlock() {
  const [code] = useState(getReferralCode);
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : `https://osweets.fr/?ref=${code}`;
  const msg = encodeURIComponent(`Découvre Ö' Sweets Pâtisserie ! Profite de -10% avec mon code ${code} : ${link}`);

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="mt-12 bg-gradient-to-br from-beige to-sable border border-gold/30 p-8 md:p-10">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gold/15 grid place-items-center shrink-0">
          <Gift className="h-6 w-6 text-gold" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium">Programme de fidélité</div>
          <h3 className="font-display text-2xl md:text-3xl mt-2">Parrainez vos proches, recevez 10%</h3>
          <p className="mt-3 text-charbon/70 font-light leading-relaxed">
            Partagez votre code unique. Pour chaque ami qui passe commande, vous recevez 10% de remise sur votre prochaine commande, et votre filleul aussi.
          </p>

          <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-3">
            <div className="bg-white border-2 border-dashed border-gold px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-charbon/50">Votre code</div>
                <div className="font-price text-2xl text-gold mt-0.5">{code}</div>
              </div>
              <button onClick={copy} className="text-gold hover:text-charbon transition" aria-label="Copier">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noreferrer" className="btn btn-gold flex-1 justify-center">
                <Share2 className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`mailto:?subject=Ö' Sweets - 10% pour toi&body=${msg}`} className="btn btn-outline-gold">Email</a>
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
  const { cart, updateQty, removeFromCart, cartTotal } = useShop();
  const shipping = useMemo(() => cart.length > 0 ? (cartTotal > 80 ? 0 : 9.9) : 0, [cart.length, cartTotal]);

  if (cart.length === 0) {
    return (
      <div className="container-os section-y text-center">
        <h1 className="font-display text-4xl">Votre panier est vide</h1>
        <p className="text-charbon/60 mt-3">Nos pâtisseries vous attendent.</p>
        <Link to="/patisserie" className="btn btn-gold mt-8 inline-flex">Découvrir la boutique</Link>
        <div className="max-w-2xl mx-auto"><ReferralBlock /></div>
      </div>
    );
  }

  return (
    <div className="container-os section-y">
      <h1 className="font-display text-4xl md:text-5xl text-center">Mon panier</h1>
      <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          {cart.map((it) => (
            <div key={lineId(it)} className="flex gap-4 bg-white border border-border p-4">
              <img src={it.image} alt={it.name} className="h-24 w-24 object-cover" />
              <div className="flex-1">
                <div className="font-display text-lg">{it.name}</div>
                <div className="font-price text-gold mt-1">{formatPrice(it.price)}</div>
                <div className="mt-3 inline-flex items-center border border-charbon">
                  <button onClick={() => updateQty(lineId(it), it.quantity - 1)} className="h-9 w-9 grid place-items-center hover:bg-sable"><Minus className="h-3 w-3" /></button>
                  <span className="w-10 text-center">{it.quantity}</span>
                  <button onClick={() => updateQty(lineId(it), it.quantity + 1)} className="h-9 w-9 grid place-items-center hover:bg-sable"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-price text-lg">{formatPrice(it.price * it.quantity)}</div>
                <button onClick={() => removeFromCart(lineId(it))} className="text-charbon/40 hover:text-destructive mt-3" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-sable p-6 h-fit sticky top-32 space-y-4">
          <h3 className="font-display text-xl">Récapitulatif</h3>
          <div className="flex justify-between text-sm"><span>Sous-total</span><span>{formatPrice(cartTotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Livraison</span><span>{shipping === 0 ? "Offerte" : formatPrice(shipping)}</span></div>
          <div className="border-t border-border pt-4 flex justify-between font-display text-lg">
            <span>Total</span><span className="text-gold font-price text-2xl">{formatPrice(cartTotal + shipping)}</span>
          </div>
          <input placeholder="Code promo / fidélité" className="w-full bg-white border border-border px-3 py-2 text-sm" />
          <Link to="/checkout" className="btn btn-gold w-full justify-center">Procéder au paiement</Link>
          <Link to="/patisserie" className="block text-center text-xs uppercase tracking-wider text-charbon/60 hover:text-gold">Continuer mes achats</Link>
        </aside>
      </div>

      <ReferralBlock />
    </div>
  );
}
