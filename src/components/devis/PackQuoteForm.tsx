import { useMemo, useState } from "react";
import { BUDGETS, ChipGroup, Field, FULFILLMENT, inputCls, QuoteNotice, toggleIn, waHref } from "./fields";

const SWEET_ITEMS = [
  "Sucré par pièce",
  "Sucré par plateau",
  "Degla farcie",
  "Mignardises",
  "Kaak Warka amande",
  "Kaak Warka pistache",
  "Kaak Warka noisette",
];

const SAVORY_ITEMS = ["Salé par pièce", "Salé par plateau"];

const EXTRAS = ["Wedding Cake", "Présentation des pâtisseries"];

export function PackQuoteForm({ eventType }: { eventType: string }) {
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [sweets, setSweets] = useState<string[]>([]);
  const [savory, setSavory] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [quantities, setQuantities] = useState("");
  const [weddingCake, setWeddingCake] = useState("Non");
  const [theme, setTheme] = useState("");
  const [colors, setColors] = useState("");
  const [budget, setBudget] = useState(BUDGETS[BUDGETS.length - 1]);
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState(FULFILLMENT[0]);
  const [allergies, setAllergies] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const link = useMemo(
    () =>
      waHref([
        `Bonjour, je souhaite un devis Pack ${eventType} :`,
        `• Type d'événement : ${eventType}`,
        `• Nom : ${name || "—"}`,
        `• Contact : ${contact || "—"}`,
        `• Date : ${date || "à définir"}`,
        `• Nombre d'invités : ${guests || "—"}`,
        `• Produits sucrés : ${sweets.join(", ") || "—"}`,
        `• Produits salés : ${savory.join(", ") || "—"}`,
        `• Options : ${extras.join(", ") || "—"}`,
        `• Wedding Cake : ${weddingCake}`,
        `• Quantités souhaitées : ${quantities || "—"}`,
        `• Thème : ${theme || "—"}`,
        `• Couleurs : ${colors || "—"}`,
        `• Budget : ${budget}`,
        `• Adresse : ${address || "—"}`,
        `• Livraison / retrait : ${fulfillment}`,
        `• Allergies : ${allergies || "—"}`,
        `• Message : ${message || "—"}`,
        photos.length > 0 && `• Photos : ${photos.map((p) => p.name).join(", ")} (je les envoie ici)`,
      ]),
    [eventType, name, contact, date, guests, sweets, savory, extras, weddingCake, quantities, theme, colors, budget, address, fulfillment, allergies, message, photos],
  );

  return (
    <div className="bg-white border border-border p-6 md:p-10">
      <h2 className="font-display text-3xl">Demande de devis — Pack {eventType}</h2>
      <p className="text-sm text-charbon/60 mt-2 font-light">
        Composez votre pack : sucré, salé, présentation et Wedding Cake. Réponse sous 48h.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        <Field label="Type d'événement">
          <input value={eventType} readOnly className={`${inputCls} bg-beige/40`} />
        </Field>
        <Field label="Date de l'événement">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Nombre d'invités">
          <input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="150" className={inputCls} />
        </Field>
        <Field label="Option Wedding Cake">
          <select value={weddingCake} onChange={(e) => setWeddingCake(e.target.value)} className={inputCls}>
            {["Non", "Oui — 1 étage", "Oui — 2 étages", "Oui — 3 étages et +", "À définir"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
      </div>

      <ChipGroup label="Produits sucrés souhaités" options={SWEET_ITEMS} selected={sweets} onToggle={(v) => setSweets(toggleIn(sweets, v))} />
      <ChipGroup label="Produits salés souhaités" options={SAVORY_ITEMS} selected={savory} onToggle={(v) => setSavory(toggleIn(savory, v))} />
      <ChipGroup label="Options complémentaires" options={EXTRAS} selected={extras} onToggle={(v) => setExtras(toggleIn(extras, v))} />

      <div className="mt-6 grid sm:grid-cols-2 gap-5">
        <Field label="Quantités souhaitées" full>
          <input value={quantities} onChange={(e) => setQuantities(e.target.value)} maxLength={300} placeholder="Ex. 600 pièces sucrées, 3 plateaux salés, 200 mignardises…" className={inputCls} />
        </Field>
        <Field label="Thème">
          <input value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={200} placeholder="Oriental, champêtre, minimaliste…" className={inputCls} />
        </Field>
        <Field label="Couleurs">
          <input value={colors} onChange={(e) => setColors(e.target.value)} maxLength={200} placeholder="Ivoire & or, sauge…" className={inputCls} />
        </Field>
        <Field label="Budget">
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls}>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Livraison ou retrait">
          <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className={inputCls}>
            {FULFILLMENT.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Adresse de l'événement" full>
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={250} placeholder="Salle, ville, code postal" className={inputCls} />
        </Field>
        <Field label="Allergies / régimes" full>
          <input value={allergies} onChange={(e) => setAllergies(e.target.value)} maxLength={300} placeholder="Fruits à coque, gluten…" className={inputCls} />
        </Field>
        <Field label="Photos d'inspiration (optionnel)" full>
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))} className={`${inputCls} file:mr-3 file:border-0 file:bg-beige file:px-3 file:py-1 file:text-xs`} />
        </Field>
        <Field label="Message libre" full>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} className={inputCls} />
        </Field>
        <Field label="Vos nom et prénom">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
        </Field>
        <Field label="Email ou téléphone">
          <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={160} className={inputCls} />
        </Field>
      </div>

      {photos.length > 0 && (
        <p className="text-xs text-charbon/60 mt-2">{photos.map((p) => p.name).join(", ")} — à envoyer dans la conversation WhatsApp.</p>
      )}

      <a href={link} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center mt-8">
        Demander mon devis
      </a>
      <QuoteNotice />
    </div>
  );
}
