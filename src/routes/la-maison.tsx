import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero-platter.jpg";
import tradition from "@/assets/maison-tradition.jpg";
import hands from "@/assets/maison-hands.jpg";
import { Leaf, Hand, BookOpen } from "lucide-react";

export const Route = createFileRoute("/la-maison")({
  head: () => ({
    meta: [
      { title: "La Maison Ö' Sweets — Notre Histoire" },
      { name: "description", content: "L'histoire d'une pâtisserie tunisienne sublimée à la française. Évry-Courcouronnes." },
      { property: "og:title", content: "La Maison Ö' Sweets" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <section className="relative h-[420px] overflow-hidden">
        <img src={hero} alt="Notre histoire" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ivory/80" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
          <div className="eyebrow">La Maison</div>
          <h1 className="font-display text-5xl md:text-7xl mt-3 italic">Notre Histoire</h1>
        </div>
      </section>

      <section className="container-os section-y grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="eyebrow">Chapitre I</div>
          <h2 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
            Une enfance bercée par la <em className="italic text-gold">fleur d'oranger</em>
          </h2>
          <p className="mt-6 text-charbon/75 leading-relaxed">
            Tout commence dans une cuisine de Tunis, où l'odeur du beurre fondu et de la fleur
            d'oranger annonçait les jours de fête. Les mains de notre grand-mère façonnaient
            le kaak warka avec une précision presque musicale — un geste appris d'elle-même
            de sa mère, et bien avant.
          </p>
          <p className="mt-4 text-charbon/75 leading-relaxed">
            C'est ce souvenir, intact et tendre, qui est devenu le cœur battant
            d'Ö' Sweets Pâtisserie.
          </p>
        </div>
        <div className="overflow-hidden">
          <img src={tradition} alt="Tradition tunisienne" loading="lazy" width={1200} height={1024} className="w-full h-[500px] object-cover" />
        </div>
      </section>

      <section className="bg-beige">
        <div className="container-os py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="overflow-hidden lg:order-first">
            <img src={hands} alt="Le geste artisanal" loading="lazy" width={1200} height={1024} className="w-full h-[500px] object-cover" />
          </div>
          <div>
            <div className="eyebrow">Chapitre II</div>
            <h2 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
              L'école française, la <em className="italic text-gold">rigueur du geste</em>
            </h2>
            <p className="mt-6 text-charbon/75 leading-relaxed">
              Formée auprès de chefs reconnus à Paris, notre fondatrice y a appris
              la patience, la précision, et cette obsession du détail qui transforme
              un dessert en bijou.
            </p>
            <p className="mt-4 text-charbon/75 leading-relaxed">
              Ö' Sweets est née de cette rencontre : la générosité de la pâtisserie
              tunisienne, et la finesse de la haute pâtisserie française.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sable section-y">
        <div className="container-os text-center">
          <div className="eyebrow">Nos valeurs</div>
          <h2 className="font-display text-3xl md:text-5xl mt-3">Trois engagements</h2>
          <div className="mt-4"><span className="divider-gold" /></div>
        </div>
        <div className="container-os mt-14 grid md:grid-cols-3 gap-10 text-center">
          {[
            { I: Leaf, t: "Ingrédients d'exception", d: "Amandes de Sicile, pistaches d'Iran, beurre AOP, miel de fleur d'oranger. Nous ne transigeons jamais." },
            { I: Hand, t: "Le fait main", d: "Chaque pièce façonnée à la main, à la commande. Pas de stock, pas d'industriel — uniquement la fraîcheur." },
            { I: BookOpen, t: "Le respect des recettes", d: "Chaque création raconte une histoire. Nous honorons la mémoire de celles qui nous ont précédées." },
          ].map(({ I, t, d }) => (
            <div key={t}>
              <I className="h-8 w-8 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl">{t}</h3>
              <p className="text-sm text-charbon/70 mt-3 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/patisserie" className="btn btn-gold">Découvrir nos créations</Link>
        </div>
      </section>
    </div>
  );
}
