// Programme de parrainage — MVP localStorage
// À brancher sur Lovable Cloud pour persistance multi-device.

const CODE_KEY = "osw_referral_code";
const STATS_KEY = "osw_referral_stats";
const APPLIED_KEY = "osw_referral_applied";

export interface ReferralStats {
  invited: number;
  earned: number; // en €
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `OSW-${out}`;
}

export function getReferralCode(): string {
  if (!isBrowser()) return "OSW-XXXX";
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = genCode();
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

export function getReferralStats(): ReferralStats {
  if (!isBrowser()) return { invited: 0, earned: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { invited: 0, earned: 0 };
  } catch {
    return { invited: 0, earned: 0 };
  }
}

export function captureRefFromUrl() {
  if (!isBrowser()) return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^OSW-[A-Z0-9]{4}$/.test(ref)) {
      localStorage.setItem(APPLIED_KEY, ref);
      return ref;
    }
  } catch {}
  return null;
}

export function getAppliedRef(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(APPLIED_KEY);
}

export function buildShareUrl(code: string): string {
  if (!isBrowser()) return `?ref=${code}`;
  return `${window.location.origin}?ref=${code}`;
}
