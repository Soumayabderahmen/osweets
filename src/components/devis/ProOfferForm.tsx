import { useMemo, useState } from "react";
import { BUDGETS, Field, FULFILLMENT, inputCls, QuoteNotice, waHref } from "./fields";

const PRO_TYPES = [
  "Coffrets clients / cadeaux d'affaires",
  "Séminaire / événement d'entreprise",
  "Pause gourmande & cocktail",
  "Commande récurrente",
  "Coffrets brandés (logo)",
  "Autre demande professionnelle",
];

export function ProOfferForm() {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState(PRO_TYPES[0]);
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState(BUDGETS[BUDGETS.length - 1]);
  const [date, setDate] = useState("");
  const [fulfillment, setFulfillment] = useState(FULFILLMENT[0]);
  const [custom, setCustom] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const link = useMemo(
    () =>
      waHref([
        "Bonjour, je souhaite une offre professionnelle :",
        `• Entreprise : ${company || "—"}`,
        `• Contact : ${contactName || "—"}`,
        `• Email : ${email || "—"}`,
        `• Téléphone : ${phone || "—"}`,
        `• Type de demande : ${type}`,
        `• Quantité : ${quantity || "—"}`,
        `• Budget : ${budget}`,
        `• Date souhaitée : ${date || "à définir"}`,
        `• Livraison / retrait : ${fulfillment}`,
        `• Personnalisation : ${custom || "—"}`,
        `• Message : ${message || "—"}`,
        logo ? `• Logo : ${logo.name} (je l'envoie ici)` : "",
      ]),
    [company, contactName, email, phone, type, quantity, budget, date, fulfillment, custom, message, logo],
  );

  return (
    <div className="bg-white border border-border p-6 md:p-10">
      <h2 className="font-display text-3xl">Demander une offre professionnelle</h2>
      <p className="text-sm text-charbon/60 mt-2 font-light">
        Coffrets brandés, séminaires, cadeaux clients — réponse sous 48h avec proposition tarifaire.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        <Field label="Nom de l'entreprise">
          <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={150} className={inputCls} />
        </Field>
        <Field label="Nom du contact">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={120} className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} className={inputCls} />
        </Field>
        <Field label="Téléphone">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputCls} />
        </Field>
        <Field label="Type de demande">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {PRO_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Quantité">
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={200} placeholder="Ex. 80 coffrets" className={inputCls} />
        </Field>
        <Field label="Budget">
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls}>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Date souhaitée">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Livraison ou retrait">
          <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className={inputCls}>
            {FULFILLMENT.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Personnalisation souhaitée">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={300} placeholder="Logo doré, carte, ruban aux couleurs…" className={inputCls} />
        </Field>
        <Field label="Logo de l'entreprise (optionnel)" full>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className={`${inputCls} file:mr-3 file:border-0 file:bg-beige file:px-3 file:py-1 file:text-xs`} />
        </Field>
        <Field label="Message" full>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} className={inputCls} />
        </Field>
      </div>

      {logo && <p className="text-xs text-charbon/60 mt-2">{logo.name} — à envoyer dans la conversation WhatsApp.</p>}

      <a href={link} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center mt-8">
        Demander mon devis
      </a>
      <QuoteNotice />
    </div>
  );
}
