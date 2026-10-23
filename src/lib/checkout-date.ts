import { parisDay, validDay } from "./calendar-day.ts";

export interface CheckoutDateSettings {
  holidayMode?: boolean;
  holidayFrom?: string;
  holidayUntil?: string;
}

export interface FulfillmentDateOptions {
  prepLeads?: Array<string | null | undefined>;
  settings?: CheckoutDateSettings;
  now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): Date {
  return new Date(`${parisDay(date)}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  const d = startOfLocalDay(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function dateInputValue(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function prepLeadDays(text?: string | null): number {
  const value = String(text ?? "").toLowerCase();
  if (!value.trim()) return 0;
  const dayMatches = [...value.matchAll(/(\d+)\s*(?:j|jour|jours)\b/g)].map((m) => Number(m[1]));
  if (dayMatches.length) return Math.max(...dayMatches);
  const hourMatches = [...value.matchAll(/(\d+)\s*h\b/g)].map((m) => Number(m[1]));
  if (hourMatches.length) return Math.ceil(Math.max(...hourMatches) / 24);
  return 0;
}

function parseDateInput(value?: string | null): Date | null {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  if (!validDay(String(value))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function minimumFulfillmentDate(options: FulfillmentDateOptions = {}): Date {
  const now = options.now ?? new Date();
  const prep = Math.max(0, ...(options.prepLeads ?? []).map(prepLeadDays));
  let min = addDays(now, prep);

  const settings = options.settings;
  if (settings?.holidayMode) {
    const until = parseDateInput(settings.holidayUntil);
    if (until && until.getTime() >= min.getTime()) min = addDays(until, 1);
  }

  return min;
}

export function validateFulfillmentDate(
  value: string,
  options: FulfillmentDateOptions = {},
): { ok: boolean; min: string; message?: string } {
  const minDate = minimumFulfillmentDate(options);
  const min = dateInputValue(minDate);
  const settings = options.settings;

  if (settings?.holidayMode && !parseDateInput(settings.holidayUntil)) {
    return {
      ok: false,
      min,
      message: "L'atelier est actuellement fermé : choisissez une date après la réouverture.",
    };
  }

  const selected = parseDateInput(value);
  if (!selected) {
    return { ok: false, min, message: "Choisissez une date de préparation ou de réception." };
  }
  if (selected.getTime() + DAY_MS <= startOfLocalDay(options.now ?? new Date()).getTime()) {
    return { ok: false, min, message: "La date choisie est déjà passée." };
  }
  if (selected.getTime() < minDate.getTime()) {
    return { ok: false, min, message: `La première date disponible est le ${min}.` };
  }
  return { ok: true, min };
}
