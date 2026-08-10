import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Ö' Sweets" },
      {
        name: "description",
        content:
          "Contact Ö' Sweets Pâtisserie — Évry-Courcouronnes. Adresse, horaires, téléphone, WhatsApp et formulaire de question générale. Pour un devis événementiel, rendez-vous sur la page dédiée.",
      },
    ],
  }),
  component: Page,
});

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Sujet requis").max(120),
  message: z.string().trim().min(5, "Message trop court").max(2000),
});

function Page() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ firstName, lastName, email, phone, subject, message });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const key = "os_contact_messages";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ ...parsed.data, submittedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // non-blocking
    }
    setSubmitted(true);
  }

  return (
    <div className="container-os section-y">
      <div className="text-center">
        <div className="eyebrow">Une question ?</div>
        <h1 className="font-display text-4xl md:text-6xl mt-3">Contact</h1>
        <div className="mt-4"><span className="divider-gold" /></div>
        <p className="mt-6 text-charbon/70 max-w-2xl mx-auto font-light">
          Une question sur nos créations, une commande en cours, un renseignement ? Écrivez-nous.
          Pour une demande de devis événementiel (mariage, anniversaire, entreprise…),{" "}
          <Link to="/devis" className="text-gold border-b border-gold/50">rendez-vous sur la page Devis →</Link>
        </p>
      </div>

      <div className="mt-16 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <div>
          {submitted ? (
            <div className="bg-white border border-gold/40 p-10 text-center">
              <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Message reçu</div>
              <h3 className="font-display text-3xl mt-4">Merci {firstName || ""} !</h3>
              <p className="mt-4 text-charbon/70 font-light max-w-md mx-auto">
                Nous revenons vers vous sous 48h à {email}.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-xs uppercase tracking-[0.25em] text-gold border-b border-gold/60 pb-0.5"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-beige p-8 space-y-4" noValidate>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom *" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom *" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
              </div>

              <div>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet *" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
                {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject}</p>}
              </div>

              <div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Votre message *" className="w-full rounded-xl border border-beige bg-white px-4 py-3 outline-none focus:border-gold" />
                {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
              </div>

              <button type="submit" className="btn btn-gold w-full justify-center">
                Envoyer mon message
              </button>
              <p className="text-[11px] text-charbon/55 text-center">
                Réponse sous 48h · vos données restent confidentielles.
              </p>
            </form>
          )}

          <div className="mt-8 bg-beige border border-gold/30 p-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">Événement à organiser ?</div>
            <h3 className="font-display text-2xl mt-2">Faites une demande de devis</h3>
            <p className="mt-2 text-sm text-charbon/70">
              Formulaire dédié avec calculateur de quantité, palette et budget.
            </p>
            <Link to="/devis" className="btn btn-gold mt-4 inline-flex">Accéder au devis</Link>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="bg-sable p-6">
            <h3 className="font-display text-2xl mb-6">Informations</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 text-gold shrink-0" />
                <span>Évry-Courcouronnes, France</span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 text-gold shrink-0" />
                <a href="tel:+33699466030" className="hover:text-gold">+33 6 99 46 60 30</a>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 text-gold shrink-0" />
                <a href="mailto:contact@osweets.fr" className="hover:text-gold">contact@osweets.fr</a>
              </li>
              <li className="flex gap-3 items-center">
                <MessageCircle className="h-5 w-5 text-gold shrink-0" />
                <a
                  href="https://wa.me/33699466030"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded"
                  style={{ background: "#25D366" }}
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-2xl mb-4">Horaires</h3>
            <ul className="text-sm space-y-1">
              <li className="flex justify-between"><span>Lundi</span><span className="text-charbon/60">Fermé</span></li>
              <li className="flex justify-between"><span>Mardi — Vendredi</span><span>10h — 19h</span></li>
              <li className="flex justify-between"><span>Samedi</span><span>10h — 20h</span></li>
              <li className="flex justify-between"><span>Dimanche</span><span>10h — 18h</span></li>
            </ul>
          </div>

          <div className="aspect-[4/3] bg-sable overflow-hidden">
            <iframe
              title="Carte Évry-Courcouronnes"
              className="w-full h-full"
              src="https://www.google.com/maps?q=Evry+Courcouronnes&output=embed"
              loading="lazy"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
