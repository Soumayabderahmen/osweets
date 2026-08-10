import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import wedding from "@/assets/wedding-buffet.jpg";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/gateaux/wedding-cakes")({
  head: () => ({
    meta: [
      { title: "Wedding Cakes sur mesure | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Wedding cakes et pièces montées sur mesure : étages, formes, parfums, garnitures et décor. Devis personnalisé sous 48h, livraison France entière.",
      },
      { property: "og:title", content: "Wedding Cakes sur mesure | Ö' Sweets" },
      {
        property: "og:description",
        content: "Créez votre wedding cake : étages, parfums, thème et couleurs. Devis sous 48h.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/gateaux/wedding-cakes` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/wedding-cakes` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Wedding Cakes sur mesure",
          description:
            "Conception de wedding cakes et pièces montées sur mesure pour mariages et fiançailles.",
          serviceType: "Wedding cake sur mesure",
          path: "/gateaux/wedding-cakes",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Wedding Cakes", path: "/gateaux/wedding-cakes" },
        ]),
      ),
    ],
  }),
  component: Page,
});

const TIERS = ["1 étage", "2 étages", "3 étages", "4 étages", "5 étages et +", "À définir"];
const SHAPES = ["Ronde", "Carrée", "Rectangulaire", "Hexagonale", "Cascade / asymétrique", "À définir"];
const FLAVORS = ["Vanille", "Chocolat", "Pistache", "Fraise", "Citron", "Café", "Fleur d'oranger", "Caramel beurre salé"];
const FILLINGS = ["Ganache", "Crème mousseline", "Namelaka pistache", "Curd citron", "Fruits frais", "Praliné croustillant"];
const BUDGETS = ["Moins de 300 €", "300 – 600 €", "600 – 1 000 €", "Plus de 1 000 €", "Je souhaite être conseillé(e)"];
const FULFILLMENT = ["Livraison", "Retrait sur rendez-vous", "Je ne sais pas encore"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.2em] text-charbon/60 mb-2">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full bg-white border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold";

function Page() {
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [tiers, setTiers] = useState(TIERS[1]);
  const [shape, setShape] = useState(SHAPES[0]);
  const [flavors, setFlavors] = useState<string[]>([]);
  const [fillings, setFillings] = useState<string[]>([]);
  const [theme, setTheme] = useState("");
  const [colors, setColors] = useState("");
  const [budget, setBudget] = useState(BUDGETS[4]);
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState(FULFILLMENT[0]);
  const [allergies, setAllergies] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const waLink = useMemo(() => {
    const lines = [
      "Bonjour, je souhaite un devis Wedding Cake :",
      `• Nom : ${name || "—"}`,
      `• Contact : ${contact || "—"}`,
      `• Date : ${date || "à définir"}`,
      `• Nombre de personnes : ${guests || "—"}`,
      `• Étages : ${tiers}`,
      `• Forme : ${shape}`,
      `• Parfums : ${flavors.join(", ") || "—"}`,
      `• Garnitures : ${fillings.join(", ") || "—"}`,
      `• Thème : ${theme || "—"}`,
      `• Couleurs : ${colors || "—"}`,
      `• Budget : ${budget}`,
      `• Adresse de l'événement : ${address || "—"}`,
      `• Livraison / retrait : ${fulfillment}`,
      `• Allergies : ${allergies || "—"}`,
      `• Commentaire : ${comment || "—"}`,
      photo ? `• Photo d'inspiration : ${photo.name} (je l'envoie ici)` : "",
    ].filter(Boolean);
    return `https://wa.me/33699466030?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [name, contact, date, guests, tiers, shape, flavors, fillings, theme, colors, budget, address, fulfillment, allergies, comment, photo]);

  return (
    <div className="bg-ivory">
      <section className="relative h-[50vh] min-h-[380px] overflow-hidden">
        <img src={wedding} alt="Wedding cake sur mesure Ö' Sweets" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Cérémonie</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Wedding Cakes
          </h1>
          <p className="mt-4 max-w-xl text-sm md:text-base font-light text-white/85">
            Pièces montées et wedding cakes sur mesure — étages, formes, parfums et décor pensés pour votre jour J.
          </p>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
        </div>
      </section>

      <section className="container-os section-y">
        <nav className="text-xs text-charbon/50 mb-8" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-gold">Accueil</Link> ·{" "}
          <Link to="/gateaux" className="hover:text-gold">Gâteaux</Link> ·{" "}
          <span className="text-charbon/70">Wedding Cakes</span>
        </nav>

        <div className="max-w-3xl mx-auto bg-white border border-border p-6 md:p-10">
          <h2 className="font-display text-3xl">Demande de devis Wedding Cake</h2>
          <p className="text-sm text-charbon/60 mt-2 font-light">Réponse sous 48h · dégustation offerte pour toute commande confirmée.</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            <Field label="Date de l'événement">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nombre de personnes">
              <input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="120" className={inputCls} />
            </Field>
            <Field label="Nombre d'étages">
              <select value={tiers} onChange={(e) => setTiers(e.target.value)} className={inputCls}>
                {TIERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Forme">
              <select value={shape} onChange={(e) => setShape(e.target.value)} className={inputCls}>
                {SHAPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-charbon/60 mb-2">Parfums</span>
            <div className="flex flex-wrap gap-2">
              {FLAVORS.map((f) => (
                <button key={f} type="button" onClick={() => toggle(flavors, setFlavors, f)}
                  className={`px-3 py-2 text-sm border transition ${flavors.includes(f) ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-charbon/60 mb-2">Garnitures</span>
            <div className="flex flex-wrap gap-2">
              {FILLINGS.map((f) => (
                <button key={f} type="button" onClick={() => toggle(fillings, setFillings, f)}
                  className={`px-3 py-2 text-sm border transition ${fillings.includes(f) ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            <Field label="Thème">
              <input value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={200} placeholder="Champêtre, oriental, minimaliste…" className={inputCls} />
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
            <div className="sm:col-span-2">
              <Field label="Adresse de l'événement">
                <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={250} placeholder="Salle, ville, code postal" className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Allergies / régimes">
                <input value={allergies} onChange={(e) => setAllergies(e.target.value)} maxLength={300} placeholder="Fruits à coque, gluten…" className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Photo d'inspiration (optionnel)">
                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className={`${inputCls} file:mr-3 file:border-0 file:bg-beige file:px-3 file:py-1 file:text-xs`} />
              </Field>
              {photo && <p className="text-xs text-charbon/60 mt-1">{photo.name} — à envoyer dans la conversation WhatsApp.</p>}
            </div>
            <div className="sm:col-span-2">
              <Field label="Commentaire libre">
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={4} className={inputCls} />
              </Field>
            </div>
            <Field label="Vos nom et prénom">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
            </Field>
            <Field label="Email ou téléphone">
              <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={160} className={inputCls} />
            </Field>
          </div>

          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center mt-8">
            Demander mon devis Wedding Cake
          </a>
          <p className="text-xs text-charbon/50 mt-3 text-center">
            Vous préférez le formulaire complet ? <Link to="/devis" search={{ type: "Mariage" }} className="underline hover:text-gold">Demande de devis événement</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
