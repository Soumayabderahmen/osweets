import { useEffect, useState } from "react";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { PICKUP_BY_APPOINTMENT_ENABLED } from "@/config/site";

// Palette de couleurs suggérées (pastilles)
const SWATCHES: { label: string; color: string }[] = [
  { label: "Or", color: "#B8894C" },
  { label: "Blanc", color: "#FFFFFF" },
  { label: "Ivoire", color: "#F5EFE1" },
  { label: "Pastel", color: "#F3D9C6" },
  { label: "Sauge", color: "#B7C3A6" },
  { label: "Terracotta", color: "#C97A5C" },
];

const PROJECT_TYPES = [
  "Mariage",
  "Fiançailles",
  "Fête d'anniversaire",
  "Baby Shower",
  "Gender Reveal",
  "Événement d'entreprise",
  "Gâteau sur mesure",
  "Coffrets personnalisés",
  "Cadeaux d'entreprise",
  "Autre",
];

const PRODUCT_WISHES = [
  "Pâtisseries tunisiennes",
  "Assortiments de pâtisseries",
  "Coffrets",
  "Gâteau",
  "Wedding Cake",
  "Verrines",
  "Cupcakes",
  "Cadeaux invités",
  "Cadeaux d'entreprise",
  "Je souhaite être conseillé(e)",
];

const BUDGETS = [
  "Moins de 100 €",
  "100 – 250 €",
  "250 – 500 €",
  "500 – 1 000 €",
  "Plus de 1 000 €",
  "Je souhaite être conseillé(e)",
];

const CONTACT_PREFS = ["Email", "Téléphone", "WhatsApp"] as const;

const FULFILLMENT = [
  "Livraison",
  "Retrait sur rendez-vous",
  "Je ne sais pas encore",
] as const;

const schema = z.object({
  projectType: z.string().min(1, "Type de projet requis"),
  eventDate: z.string().min(1, "Date requise"),
  guests: z.coerce.number().int().min(1, "Nombre de personnes requis").max(5000),
  city: z.string().trim().min(1, "Ville requise").max(120),
  venue: z.string().trim().max(200).optional().or(z.literal("")),
  eventTime: z.string().max(20).optional().or(z.literal("")),
  fulfillment: z.string().min(1),
  wishes: z.array(z.string()).min(0),
  pieceCount: z.string().trim().max(60).optional().or(z.literal("")),
  flavors: z.string().trim().max(300).optional().or(z.literal("")),
  colorsTheme: z.string().trim().max(200).optional().or(z.literal("")),
  inscription: z.string().trim().max(200).optional().or(z.literal("")),
  giftMessage: z.string().trim().max(500).optional().or(z.literal("")),
  presentationNotes: z.string().trim().max(500).optional().or(z.literal("")),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(6, "Téléphone requis").max(30),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  contactPref: z.string().min(1),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Consentement requis" }),
});

export type QuotePrefill = {
  projectType?: string;
  guests?: number;
  productType?: string;
  suggestedSize?: string;
  eventDate?: string;
  flavors?: string;
  allergies?: string;
  message?: string;
};


export function QuoteForm({
  defaultProjectType,
  source,
  prefill,
  productOptions: _productOptions,
}: {
  defaultProjectType?: string;
  /** @deprecated legacy prop — utiliser defaultProjectType */
  source?: string;
  prefill?: QuotePrefill;
  /** @deprecated legacy prop — les produits sont maintenant sélectionnés via les cases à cocher intégrées */
  productOptions?: string[];
}) {
  const initialType = defaultProjectType || source || PROJECT_TYPES[0];
  const [projectType, setProjectType] = useState(initialType);
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState<number | "">("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [fulfillment, setFulfillment] = useState<string>(FULFILLMENT[2]);

  const [wishes, setWishes] = useState<string[]>([]);
  const [pieceCount, setPieceCount] = useState("");
  const [flavors, setFlavors] = useState("");
  const [colorsTheme, setColorsTheme] = useState("");
  const [themeColor, setThemeColor] = useState<string | null>(null);
  const [inscription, setInscription] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [presentationNotes, setPresentationNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [budget, setBudget] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [contactPref, setContactPref] = useState<string>(CONTACT_PREFS[0]);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    const t = defaultProjectType || source;
    if (t) setProjectType(t);
  }, [defaultProjectType, source]);

  // Prefill suggestedSize → presentationNotes (compat legacy)
  useEffect(() => {
    if (prefill?.suggestedSize) {
      setPresentationNotes((prev) =>
        prev.includes(prefill.suggestedSize!) ? prev : [prev, `Recommandation : ${prefill.suggestedSize}`].filter(Boolean).join(" · "),
      );
    }
  }, [prefill?.suggestedSize]);

  useEffect(() => {
    if (prefill?.projectType) setProjectType(prefill.projectType);
    if (prefill?.guests) setGuests(prefill.guests);
    if (prefill?.productType) setWishes((w) => (w.includes(prefill.productType!) ? w : [...w, prefill.productType!]));
    if (prefill?.eventDate) setEventDate(prefill.eventDate);
    if (prefill?.flavors) setFlavors(prefill.flavors);
    if (prefill?.allergies) setAllergies(prefill.allergies);
    if (prefill?.message) setMessage(prefill.message);
  }, [
    prefill?.projectType,
    prefill?.guests,
    prefill?.productType,
    prefill?.eventDate,
    prefill?.flavors,
    prefill?.allergies,
    prefill?.message,
  ]);


  function toggleWish(w: string) {
    setWishes((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const tooBig = list.find((f) => f.size > 8 * 1024 * 1024);
    const badType = list.find((f) => !allowed.includes(f.type));
    if (badType) return setFileError("Format non supporté (JPG, PNG ou PDF uniquement).");
    if (tooBig) return setFileError("Fichier trop lourd (max 8 Mo).");
    setFileError(null);
    setFiles((prev) => [...prev, ...list].slice(0, 5));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const themeCombined = [themeColor, colorsTheme].filter(Boolean).join(" · ");
    const payload = {
      projectType, eventDate, guests, city, venue, eventTime, fulfillment,
      wishes, pieceCount, flavors, colorsTheme: themeCombined, inscription,
      giftMessage, presentationNotes, allergies, budget,
      firstName, lastName, email, phone, company, contactPref, message,
      consent,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    // ─────────────────────────────────────────────────────────────
    // TODO: connecter la soumission à un service réel — ne pas activer
    // avant cette étape (email transactionnel, base sécurisée, ou webhook).
    // Aucune donnée n'est envoyée ni stockée pour le moment.
    // Ne PAS utiliser localStorage pour ce formulaire.
    // ─────────────────────────────────────────────────────────────
    // Exemple d'intégration future :
    //   await fetch("/api/public/quote", {
    //     method: "POST",
    //     body: buildFormData(parsed.data, files),
    //   });
    // ─────────────────────────────────────────────────────────────

    setSubmitting(false);
    setNotConnected(true);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border p-6 md:p-10 space-y-8" noValidate>
      <header className="text-center border-b border-border pb-6">
        <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Devis événementiel</div>
        <h2 className="font-display text-3xl md:text-4xl mt-3">Parlez-nous de votre événement</h2>
        <p className="mt-4 text-charbon/70 font-light max-w-2xl mx-auto">
          Chaque projet est unique. Partagez-nous les détails de votre événement afin que notre
          équipe puisse vous proposer une création adaptée à vos envies.
        </p>
      </header>

      {/* Type de projet */}
      <section>
        <h3 className="font-display text-xl mb-4">1. Type de projet</h3>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setProjectType(t)}
              className={`px-3 py-2 text-xs uppercase tracking-[0.2em] border transition ${
                projectType === t ? "border-gold bg-beige text-charbon" : "border-border hover:border-gold/60 text-charbon/75"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Informations événement */}
      <section>
        <h3 className="font-display text-xl mb-4">2. Informations sur l'événement</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Date *</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full bg-white border border-border px-4 py-3" />
            {errors.eventDate && <p className="text-xs text-red-600 mt-1">{errors.eventDate}</p>}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Nombre de personnes *</label>
            <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value === "" ? "" : +e.target.value)} placeholder="Ex : 80" className="w-full bg-white border border-border px-4 py-3" />
            {errors.guests && <p className="text-xs text-red-600 mt-1">{errors.guests}</p>}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Ville *</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Évry-Courcouronnes" className="w-full bg-white border border-border px-4 py-3" />
            {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Lieu (facultatif)</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Salle, domicile, jardin…" className="w-full bg-white border border-border px-4 py-3" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Horaire (facultatif)</label>
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-white border border-border px-4 py-3" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Mode *</label>
            <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className="w-full bg-white border border-border px-4 py-3">
              {FULFILLMENT.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            {!PICKUP_BY_APPOINTMENT_ENABLED && fulfillment === "Retrait sur rendez-vous" && (
              <p className="text-[11px] text-charbon/55 mt-1">Sous réserve de disponibilité — à confirmer avec notre équipe.</p>
            )}
          </div>
        </div>
      </section>

      {/* Produits souhaités */}
      <section>
        <h3 className="font-display text-xl mb-4">3. Produits souhaités</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {PRODUCT_WISHES.map((p) => {
            const active = wishes.includes(p);
            return (
              <label key={p} className={`flex items-center gap-3 px-4 py-2.5 border cursor-pointer transition ${active ? "border-gold bg-beige" : "border-border hover:border-gold/60"}`}>
                <input type="checkbox" checked={active} onChange={() => toggleWish(p)} className="accent-[color:var(--color-gold)]" />
                <span className="text-sm">{p}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Personnalisation */}
      <section>
        <h3 className="font-display text-xl mb-4">4. Personnalisation</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={pieceCount} onChange={(e) => setPieceCount(e.target.value)} placeholder="Nombre de pièces souhaité" className="w-full bg-white border border-border px-4 py-3" />
          <input value={flavors} onChange={(e) => setFlavors(e.target.value)} placeholder="Saveurs préférées (amande, pistache, chocolat…)" className="w-full bg-white border border-border px-4 py-3" />
        </div>

        <div className="mt-4">
          <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-2">Couleurs / thème</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SWATCHES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setThemeColor(themeColor === s.label ? null : s.label)}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 border transition ${themeColor === s.label ? "border-gold bg-beige" : "border-border hover:border-gold/60"}`}
              >
                <span className="inline-block h-5 w-5 rounded-full border border-charbon/10" style={{ background: s.color }} />
                <span className="text-xs tracking-wider uppercase">{s.label}</span>
              </button>
            ))}
          </div>
          <input value={colorsTheme} onChange={(e) => setColorsTheme(e.target.value)} placeholder="Ambiance libre (ex : bohème, oriental doré…)" className="w-full bg-white border border-border px-4 py-3" />
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <input value={inscription} onChange={(e) => setInscription(e.target.value)} placeholder="Texte à inscrire (sur gâteau, plaque…)" className="w-full bg-white border border-border px-4 py-3" />
          <input value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Message personnalisé (carte, mot…)" className="w-full bg-white border border-border px-4 py-3" />
        </div>

        <textarea value={presentationNotes} onChange={(e) => setPresentationNotes(e.target.value)} rows={2} placeholder="Préférences de présentation (plateau, coffret, buffet…)" className="mt-4 w-full bg-white border border-border px-4 py-3" />

        <div className="mt-4">
          <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Allergies / contraintes à signaler</label>
          <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} placeholder="Merci d'indiquer les allergènes à signaler à vos invités." className="w-full bg-white border border-border px-4 py-3" />
          <p className="text-[11px] text-charbon/55 mt-1">
            Nos pâtisseries sont préparées dans un atelier manipulant fruits à coque, œufs, gluten et lait.
            Nous ne pouvons pas garantir l'absence totale de traces d'allergènes.
          </p>
        </div>
      </section>

      {/* Budget */}
      <section>
        <h3 className="font-display text-xl mb-4">5. Budget indicatif <span className="text-xs text-charbon/50 font-body normal-case">(facultatif)</span></h3>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget(budget === b ? "" : b)}
              className={`px-3 py-2 text-xs uppercase tracking-[0.15em] border transition ${
                budget === b ? "border-gold bg-beige" : "border-border hover:border-gold/60 text-charbon/75"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      {/* Inspiration */}
      <section>
        <h3 className="font-display text-xl mb-4">6. Images d'inspiration <span className="text-xs text-charbon/50 font-body normal-case">(facultatif)</span></h3>
        <label className="flex items-center justify-center gap-2 border border-dashed border-border hover:border-gold/60 px-4 py-6 cursor-pointer text-sm text-charbon/70">
          <span className="text-gold">＋</span>
          <span>Ajouter des images (JPG, PNG, PDF — max 5 fichiers, 8 Mo chacun)</span>
          <input type="file" accept="image/jpeg,image/png,application/pdf" multiple onChange={handleFiles} className="hidden" />
        </label>
        {fileError && <p className="text-xs text-red-600 mt-2">{fileError}</p>}
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-charbon/70">
            {files.map((f, i) => (
              <li key={i} className="flex justify-between border-b border-border/60 py-1">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gold text-xs uppercase tracking-widest">
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Coordonnées */}
      <section>
        <h3 className="font-display text-xl mb-4">7. Vos coordonnées</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom *" className="w-full bg-white border border-border px-4 py-3" />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom *" className="w-full bg-white border border-border px-4 py-3" />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
          </div>
          <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="w-full bg-white border border-border px-4 py-3" />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone *" className="w-full bg-white border border-border px-4 py-3" />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nom d'entreprise (facultatif)" className="w-full bg-white border border-border px-4 py-3" />
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-charbon/55 block mb-1">Préférence de contact</label>
            <select value={contactPref} onChange={(e) => setContactPref(e.target.value)} className="w-full bg-white border border-border px-4 py-3">
              {CONTACT_PREFS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Message libre */}
      <section>
        <h3 className="font-display text-xl mb-4">8. Parlez-nous de votre projet</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Décrivez votre événement, vos envies, votre inspiration…" className="w-full bg-white border border-border px-4 py-3" />
      </section>

      {/* Consentement */}
      <label className="flex items-start gap-3 text-sm text-charbon/75">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[color:var(--color-gold)]" />
        <span>
          J'accepte que mes informations soient utilisées pour traiter ma demande, conformément à la{" "}
          <Link to="/confidentialite" className="text-gold border-b border-gold/50">politique de confidentialité</Link>. *
        </span>
      </label>
      {errors.consent && <p className="text-xs text-red-600">{errors.consent}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-gold w-full justify-center disabled:opacity-60"
      >
        {submitting ? "Envoi…" : "Envoyer ma demande de devis"}
      </button>

      {notConnected && (
        <div className="border border-amber-400 bg-amber-50 text-amber-900 p-4 text-sm">
          <strong>Envoi non connecté.</strong> Ce formulaire est prêt côté interface mais la
          transmission n'est pas encore branchée à un service (email, base sécurisée ou webhook).
          Aucune donnée n'a été envoyée ni stockée. Contactez l'équipe technique pour activer
          l'envoi réel.
        </div>
      )}
    </form>
  );
}
