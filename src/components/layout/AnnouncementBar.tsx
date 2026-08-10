import { ANNOUNCEMENT_MESSAGE } from "@/config/site";

export function AnnouncementBar() {
  return (
    <div className="bg-charbon text-ivory/80 overflow-hidden">
      <div className="marquee py-2.5">
        <div className="marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-3 whitespace-nowrap px-8 text-[10px] uppercase tracking-[0.25em]"
            >
              <span className="text-gold">◆</span>
              <span className="text-ivory/80">{ANNOUNCEMENT_MESSAGE}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
