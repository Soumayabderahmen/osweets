import { createFileRoute } from "@tanstack/react-router";
import { products } from "@/data/products";

export const Route = createFileRoute("/galerie")({
  head: () => ({ meta: [{ title: "Galerie — Ö' Sweets" }, { name: "description", content: "Galerie photos de nos pâtisseries, coffrets et événements." }] }),
  component: Page,
});

function Page() {
  const imgs = products.map((p) => p.image);
  return (
    <div className="container-os section-y">
      <div className="text-center"><div className="eyebrow">Nos créations</div><h1 className="font-display text-4xl md:text-5xl mt-3">Galerie</h1><div className="mt-4"><span className="divider-gold" /></div></div>
      <div className="mt-12 columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
        {[...imgs, ...imgs].map((img, i) => (
          <div key={i} className="mb-3 break-inside-avoid overflow-hidden group cursor-pointer">
            <img src={img} alt="Création Ö' Sweets" loading="lazy" className="w-full transition duration-700 group-hover:scale-105" />
          </div>
        ))}
      </div>
    </div>
  );
}
