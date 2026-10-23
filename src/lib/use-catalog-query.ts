import { useRef, type SetStateAction } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { readCatalogQuery, type CatalogQuery } from "./catalog-query";

export function useCatalogQuery(bounds: { min: number; max: number }) {
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.search as Record<string, unknown>;
  const state = readCatalogQuery(search.f, bounds);
  const pending = useRef({ search, raw: search.f });
  if (pending.current.search !== search) pending.current = { search, raw: search.f };
  const setter =
    <K extends keyof CatalogQuery>(key: K) =>
    (value: SetStateAction<CatalogQuery[K]>) => {
      const previous = readCatalogQuery(pending.current.raw, bounds);
      const next = {
        ...previous,
        [key]: typeof value === "function" ? value(previous[key]) : value,
        ...(key === "priceMin" || key === "priceMax" ? { priceTouched: true } : {}),
      };
      pending.current.raw = next;
      void navigate({
        to: location.pathname,
        search: { ...search, f: next } as never,
        replace: true,
        resetScroll: false,
      });
    };
  const reset = () => {
    pending.current.raw = undefined;
    void navigate({
      to: location.pathname,
      search: { ...search, f: undefined } as never,
      replace: true,
      resetScroll: false,
    });
  };
  return { state, setter, reset };
}
