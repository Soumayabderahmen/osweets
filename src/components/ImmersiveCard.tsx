import { Link } from "@tanstack/react-router";

interface ImmersiveCardProps {
  to: string;
  params?: Record<string, string>;
  image: string;
  title: string;
  subtitle?: string;
  ratio?: "portrait" | "landscape" | "square";
  /** "center" (défaut, immersif — Cadeaux/Événements) ou "bottom-left" (titre seul, overlay simplifié — L'Art d'Offrir). */
  overlay?: "center" | "bottom-left";
  /** "md" (défaut) ou "2xl" pour les cards éditoriales à coins plus arrondis. */
  rounded?: "md" | "2xl";
}

export function ImmersiveCard({
  to,
  params,
  image,
  title,
  subtitle,
  ratio = "landscape",
  overlay = "center",
  rounded = "md",
}: ImmersiveCardProps) {
  const ratioClass =
    ratio === "portrait" ? "aspect-[3/4]" : ratio === "square" ? "aspect-square" : "aspect-[4/3]";
  const roundedClass = rounded === "2xl" ? "rounded-2xl" : "rounded-md";
  const bgClass = overlay === "bottom-left" ? "bg-sand" : "bg-charbon";
  const zoomClass =
    overlay === "bottom-left"
      ? "duration-[1100ms] ease-out group-hover:scale-105"
      : "duration-700 ease-out group-hover:scale-110";

  const inner = (
    <div
      className={`relative ${ratioClass} overflow-hidden ${roundedClass} ${bgClass} group cursor-pointer`}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover transition-transform ${zoomClass}`}
      />
      {overlay === "bottom-left" ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-charbon/55 to-transparent" />
          <div className="absolute bottom-5 left-5">
            <h3 className="font-display text-xl md:text-2xl text-ivory">{title}</h3>
          </div>
        </>
      ) : (
        <>
          {/* Strong dark gradient for legibility — like the reference */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-gold/60 transition" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h3
              className="font-display text-white text-3xl md:text-4xl lg:text-[2.6rem] leading-tight tracking-tight"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mt-3 text-white/90 text-xs md:text-sm tracking-[0.18em] uppercase font-light">
                {subtitle}
              </p>
            )}
            <span className="mt-5 inline-block h-px w-10 bg-gold opacity-0 group-hover:opacity-100 group-hover:w-16 transition-all duration-500" />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Link to={to as string} params={params as never}>
      {inner}
    </Link>
  );
}
