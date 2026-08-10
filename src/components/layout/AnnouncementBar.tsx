import { ANNOUNCEMENT_MESSAGE } from "@/config/site";

export function AnnouncementBar() {
  return (
    <div className="bg-charbon text-ivory overflow-hidden">
      <div className="marquee py-2 text-[11px] tracking-[0.18em] uppercase font-light">
        <div className="marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3 text-gold">
              <span>✦</span>
              <span className="text-ivory">{ANNOUNCEMENT_MESSAGE}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
