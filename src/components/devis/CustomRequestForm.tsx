import { useMemo, useState } from "react";
import { BUDGETS, ChipGroup, Field, FULFILLMENT, inputCls, QuoteNotice, toggleIn, waHref } from "./fields";

const REQUEST_TYPES = [
  "Gâteau personnalisé",
  "Wedding Cake",
  "Bento Cake",
  "Coffret",
  "Mariage",
  "Fiançailles",
  "Circoncision / Thour",
  "Événement privé",
  "Commande professionnelle",
];

const PRODUCTS = [
  "Pâtisseries tunisiennes",
  "Mignardises",
  "Kaak Warka",
  "Degla farcie",
  "Salé",
  "Gâteau",
  "Wedding Cake",
  "Coffrets",
  "Présentation / mise en scène",
];

export function CustomRequestForm({ defaultType }: { defaultType?: string }) {
  const [type, setType] = useState(defaultType ?? REQUEST_TYPES[0]);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [products, setProducts] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [flavors, setFlavors] = useState("");
  const [budget, setBudget] = useState(BUDGETS[BUDGETS.length - 1]);
  const [fulfillment, setFulfillment] = useState(FULFILLMENT[0]);
  const [allergies, setAllergies] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const link = useMemo(
    () =>
      waHref([
        "Bonjour, je souhaite une création sur mesure :",
        `• Type de demande : ${type}`,
        `• Nom : ${name || "—"}`,
        `• Contact : ${contact || "—"}`,
        `• Date souhaitée : ${date || "à définir"}`,
        `• Nombre de personnes : ${guests || "—"}`,
        `• Produits : ${products.join(", ") || "—"}`,
        `• Quantité : ${quantity || "—"}`,
        `• Parfums : ${flavors || "—"}`,
        `• Budget : ${budget}`,
        `• Livraison / retrait : ${fulfillment}`,
        `• Allergies : ${allergies || "—"}`,
        `• Message : ${message || "—"}`,
        photos.length > 0 && `• Photos d'inspiration : ${photos.map((p) => p.name).join(", ")} (je les envoie ici)`,
      ]),
    [type, name, contact, date, guests, products, quantity, flavors, budget, fulfillment, allergies, message, photos],
  );

  return (
    <div className="bg-white border border-border p-6 md:p-10">
      <h2 className="font-display text-3xl">Demander une création sur mesure</h2>
      <p className="text-sm text-charbon/60 mt-2 font-light">
        Décrivez votre projet — nous vous répondons sous 48h avec une proposition chiffrée.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        <Field label="Type de demande">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Date souhaitée">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Nombre de personnes">
          <input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="40" className={inputCls} />
        </Field>
        <Field label="Quantité souhaitée">
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={200} placeholder="Ex. 300 pièces, 2 coffrets…" className={inputCls} />
        </Field>
      </div>

      <ChipGroup label="Produits" options={PRODUCTS} selected={products} onToggle={(v) => setProducts(toggleIn(products, v))} />

      <div className="mt-6 grid sm:grid-cols-2 gap-5">
        <Field label="Parfums">
          <input value={flavors} onChange={(e) => setFlavors(e.target.value)} maxLength={250} placeholder="Pistache, chocolat, fleur d'oranger…" className={inputCls} />
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
        <Field label="Allergies / régimes">
          <input value={allergies} onChange={(e) => setAllergies(e.target.value)} maxLength={300} className={inputCls} />
        </Field>
        <Field label="Photos d'inspiration (optionnel)" full>
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))} className={`${inputCls} file:mr-3 file:border-0 file:bg-beige file:px-3 file:py-1 file:text-xs`} />
        </Field>
        <Field label="Message" full>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} className={inputCls} />
        </Field>
        <Field label="Vos nom et prénom">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
        </Field>
        <Field label="Email ou téléphone">
          <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={160} className={inputCls} />
        </Field>
      </div>

      <a href={link} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center mt-8">
        Demander mon devis
      </a>
      <QuoteNotice />
    </div>
  );
}
