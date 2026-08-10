import type { ReactNode } from "react";

/** Art-deco / Tunisian-inspired corner bracket — thin gold line. */
export function CornerOrnament({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`absolute text-gold ${className}`}
      style={{ width: size, height: size }}
      fill="none"
      stroke="currentColor"
    >
      <path d="M2 18 V4 H18" strokeWidth="1.2" />
      <path d="M6 14 V8 H14" strokeWidth="0.7" />
      <path d="M8 8 L13 13" strokeWidth="0.6" />
    </svg>
  );
}

/** Small 8-point gold rosette (Tunisian Qallaline motif). */
export function Rosette({
  className = "",
  size = 12,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`inline-block text-gold ${className}`}
      style={{ width: size, height: size }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <rect x="6" y="6" width="12" height="12" />
      <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
    </svg>
  );
}

/** Divider line — gold hairline with centered rosette. */
export function DividerRosette({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center gap-3 text-gold ${className}`}
    >
      <span className="h-px flex-1 bg-gold/40" />
      <Rosette />
      <span className="h-px flex-1 bg-gold/40" />
    </div>
  );
}

/** Ornate frame container: gold double border + 4 corner ornaments. */
export function OrnateFrame({
  children,
  className = "",
  padded = true,
  cornerSize = 28,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  cornerSize?: number;
}) {
  return (
    <div
      className={`relative bg-ivory ${padded ? "p-6 md:p-7" : ""} ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-1.5 border border-gold/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10px] border border-gold/25"
      />
      <CornerOrnament className="top-1 left-1" size={cornerSize} />
      <CornerOrnament className="top-1 right-1 rotate-90" size={cornerSize} />
      <CornerOrnament
        className="bottom-1 left-1 -rotate-90"
        size={cornerSize}
      />
      <CornerOrnament
        className="bottom-1 right-1 rotate-180"
        size={cornerSize}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
