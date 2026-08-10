import { Link } from "@tanstack/react-router";
import { products, type Product } from "@/data/products";

export function EventHero({
  eyebrow,
  title,
  subtitle,
  image,
  tint = "black/60",
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  image: string;
  tint?: string;
}) {
  return (
    <section className="relative h-[62vh] min-h-[460px] overflow-hidden">
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-${tint}`} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
        {eyebrow && (
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">{eyebrow}</div>
        )}
        <h1
          className="font-display text-5xl md:text-7xl mt-5 text-white"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}
        >
          {title}
        </h1>
        <span className="mt-6 inline-block h-px w-16 bg-gold" />
        <p className="mt-6 max-w-xl text-white/90 font-light leading-relaxed">{subtitle}</p>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return (
    <div className="text-center mb-12">
      {eyebrow && <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium">{eyebrow}</div>}
      <h2 className="font-display text-3xl md:text-5xl mt-3">{title}</h2>
      <span className="mt-5 inline-block h-px w-16 bg-gold" />
      {desc && <p className="mt-5 text-charbon/70 max-w-2xl mx-auto font-light">{desc}</p>}
    </div>
  );
}

export function SuggestedProducts({ slugs }: { slugs: string[] }) {
  const items = slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => !!p);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {items.map((p) => (
        <Link
          key={p.slug}
          to="/produits/$slug"
          params={{ slug: p.slug }}
          className="group block bg-white border border-border hover:border-gold/60 transition"
        >
          <div className="aspect-[4/5] overflow-hidden bg-beige">
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
            />
          </div>
          <div className="p-4">
            <h3 className="font-display text-base leading-tight">{p.name}</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-charbon/55">{p.category}</span>
              <span className="font-price text-gold">{p.price}€</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CrossLinkBanner({
  to,
  params,
  eyebrow,
  title,
  cta,
  image,
}: {
  to: string;
  params?: Record<string, string>;
  eyebrow: string;
  title: string;
  cta: string;
  image: string;
}) {
  return (
    <Link
      to={to as string}
      params={params as never}
      className="group relative block overflow-hidden bg-charbon"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition duration-[900ms]"
      />
      <div className="relative z-10 px-8 py-14 md:py-16 text-center text-white">
        <div className="text-[10px] tracking-[0.35em] uppercase text-gold">{eyebrow}</div>
        <h3
          className="font-display text-2xl md:text-4xl mt-3"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          {title}
        </h3>
        <span className="mt-5 inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-gold border-b border-gold/60 pb-1">
          {cta} →
        </span>
      </div>
    </Link>
  );
}

export function PracticalInfo({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((it) => (
        <div key={it.label} className="bg-white border border-border p-6">
          <div className="text-[10px] uppercase tracking-[0.28em] text-gold">{it.label}</div>
          <div className="mt-3 font-display text-lg leading-snug">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function SocialProof({
  images,
  testimonials,
}: {
  images: string[];
  testimonials: { name: string; text: string; event?: string }[];
}) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden bg-beige">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover hover:scale-105 transition duration-[900ms]" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {testimonials.map((t) => (
          <figure key={t.name} className="bg-sable p-6 border-l-2 border-gold">
            <blockquote className="font-display text-lg leading-snug text-charbon">« {t.text} »</blockquote>
            <figcaption className="mt-4 text-xs uppercase tracking-wider text-charbon/60">
              {t.name}
              {t.event && <span className="text-gold"> · {t.event}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function FinalCTA({
  title,
  desc,
  primary,
  secondary,
}: {
  title: string;
  desc?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="bg-charbon text-ivory">
      <div className="container-os py-20 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-white">{title}</h2>
        {desc && <p className="mt-5 text-ivory/70 max-w-xl mx-auto font-light">{desc}</p>}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <a href={primary.href} target="_blank" rel="noreferrer" className="btn btn-gold">
            {primary.label}
          </a>
          {secondary && (
            <Link to={secondary.to as string} className="btn btn-outline-gold text-ivory border-ivory/40">
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
