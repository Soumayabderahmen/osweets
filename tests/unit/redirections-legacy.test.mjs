import assert from "node:assert/strict";
import test from "node:test";

import {
  REDIRECTIONS_LEGACY,
  destinationLegacy,
} from "../../src/lib/redirections-legacy.ts";

test("une ancienne adresse de fiche retiree mene a sa remplacante", () => {
  assert.equal(destinationLegacy("/produits/samsa-amandes"), "/produits/samsa-moelleuse");
  assert.equal(destinationLegacy("/produits/samsa-praline-pistache"), "/produits/samsa-moelleuse");
});

test("une fiche scindee ou sans remplacante mene a sa collection", () => {
  assert.equal(destinationLegacy("/produits/ghraiba"), "/patisserie/patisseries-orientales");
  assert.equal(destinationLegacy("/produits/youyou"), "/patisserie/patisseries-orientales");
});

test("les collections masquees menent a celle qui les remplace", () => {
  assert.equal(destinationLegacy("/patisserie/tradition"), "/patisserie/patisseries-orientales");
  assert.equal(destinationLegacy("/patisserie/amandes"), "/patisserie/patisseries-orientales");
  // « Perles » n'avait aucun produit : l'index plutot qu'une collection
  // qui ne lui correspond pas.
  assert.equal(destinationLegacy("/patisserie/perles"), "/patisserie");
});

test("une adresse vivante n'est jamais redirigee", () => {
  for (const vivante of [
    "/",
    "/patisserie",
    "/patisserie/ramadan",
    "/patisserie/patisseries-orientales",
    "/produits/kaak-warka",
    "/produits/samsa-moelleuse",
    "/panier",
  ]) {
    assert.equal(destinationLegacy(vivante), null, `${vivante} ne doit pas rediriger`);
  }
});

test("la barre oblique finale est ignoree", () => {
  assert.equal(destinationLegacy("/patisserie/tradition/"), "/patisserie/patisseries-orientales");
  // La racine garde sa barre : elle ne doit pas devenir une chaine vide.
  assert.equal(destinationLegacy("/"), null);
});

test("la chaine de requete est conservee (le tracage d'un lien partage survit)", () => {
  assert.equal(
    destinationLegacy("/patisserie/tradition", "?utm_source=instagram"),
    "/patisserie/patisseries-orientales?utm_source=instagram",
  );
});

test("REGRESSION: aucune redirection ne pointe vers une autre redirection (pas de chaine)", () => {
  for (const [depuis, vers] of Object.entries(REDIRECTIONS_LEGACY)) {
    assert.equal(
      destinationLegacy(vers),
      null,
      `${depuis} mene a ${vers}, qui redirige a son tour : Google perdrait le lien`,
    );
  }
});

test("REGRESSION: aucune redirection ne boucle sur elle-meme", () => {
  for (const [depuis, vers] of Object.entries(REDIRECTIONS_LEGACY)) {
    assert.notEqual(depuis, vers, `${depuis} se redirige vers elle-meme`);
  }
});
