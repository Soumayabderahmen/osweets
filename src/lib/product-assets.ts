/**
 * Photos livrées avec le site (`src/assets`).
 *
 * La base ne stocke qu'une clé (`image_key`, le nom du fichier) : le bundler
 * a besoin d'un import statique pour empreinter et servir l'image. Le
 * backoffice propose donc cette liste, et `image_url` prend le dessus dès
 * qu'une photo est téléversée.
 *
 * Fichier GÉNÉRÉ — régénérer avec : node scripts/generate-asset-map.mjs
 */
import a_cakeChocolat from "@/assets/cake-chocolat.jpg";
import a_cakeCitron from "@/assets/cake-citron.jpg";
import a_cakeNoisette from "@/assets/cake-noisette.jpg";
import a_cakePistache from "@/assets/cake-pistache.jpg";
import a_cakeVanille from "@/assets/cake-vanille.jpg";
import a_catCakes from "@/assets/cat-cakes.jpg";
import a_catCoffrets from "@/assets/cat-coffrets.jpg";
import a_catKaak from "@/assets/cat-kaak.jpg";
import a_catPatisserie from "@/assets/cat-patisserie.jpg";
import a_catSale from "@/assets/cat-sale.jpg";
import a_coffretOrCitronAmandeTulle from "@/assets/coffret-or-citron-amande-tulle.jpg";
import a_coffretOrCroissantsPistache from "@/assets/coffret-or-croissants-pistache.jpg";
import a_coffretOrMignardisesChocolat from "@/assets/coffret-or-mignardises-chocolat.jpg";
import a_coffretOrNoixChocolatOr from "@/assets/coffret-or-noix-chocolat-or.jpg";
import a_collectionAidEidMubarak from "@/assets/collection-aid-eid-mubarak.jpg";
import a_composerHero from "@/assets/composer-hero.jpg";
import a_cookiePistacheChocolatDuo from "@/assets/cookie-pistache-chocolat-duo.jpg";
import a_heroPlateauSignature from "@/assets/hero-plateau-signature.jpg";
import a_heroPlatter from "@/assets/hero-platter.jpg";
import a_logoProduitBrandingOfficiel from "@/assets/logo-produit-branding-officiel.jpg";
import a_maisonHands from "@/assets/maison-hands.jpg";
import a_maisonTradition from "@/assets/maison-tradition.jpg";
import a_mignardisesTulleMariage from "@/assets/mignardises-tulle-mariage.jpg";
import a_pBaklawa from "@/assets/p-baklawa.jpg";
import a_pGhrayba from "@/assets/p-ghrayba.jpg";
import a_pKaakWarka from "@/assets/p-kaak-warka.jpg";
import a_pKaakYouyou from "@/assets/p-kaak-youyou.jpg";
import a_pMakroudh from "@/assets/p-makroudh.jpg";
import a_pMignardises from "@/assets/p-mignardises.jpg";
import a_pSamsa from "@/assets/p-samsa.jpg";
import a_pastillesPistacheChocolat from "@/assets/pastilles-pistache-chocolat.jpg";
import a_plateauOrAssortimentSignature from "@/assets/plateau-or-assortiment-signature.jpg";
import a_weddingBuffet from "@/assets/wedding-buffet.jpg";

/** Nom de fichier → URL construite par Vite. */
export const PRODUCT_ASSETS: Record<string, string> = {
  "cake-chocolat.jpg": a_cakeChocolat,
  "cake-citron.jpg": a_cakeCitron,
  "cake-noisette.jpg": a_cakeNoisette,
  "cake-pistache.jpg": a_cakePistache,
  "cake-vanille.jpg": a_cakeVanille,
  "cat-cakes.jpg": a_catCakes,
  "cat-coffrets.jpg": a_catCoffrets,
  "cat-kaak.jpg": a_catKaak,
  "cat-patisserie.jpg": a_catPatisserie,
  "cat-sale.jpg": a_catSale,
  "coffret-or-citron-amande-tulle.jpg": a_coffretOrCitronAmandeTulle,
  "coffret-or-croissants-pistache.jpg": a_coffretOrCroissantsPistache,
  "coffret-or-mignardises-chocolat.jpg": a_coffretOrMignardisesChocolat,
  "coffret-or-noix-chocolat-or.jpg": a_coffretOrNoixChocolatOr,
  "collection-aid-eid-mubarak.jpg": a_collectionAidEidMubarak,
  "composer-hero.jpg": a_composerHero,
  "cookie-pistache-chocolat-duo.jpg": a_cookiePistacheChocolatDuo,
  "hero-plateau-signature.jpg": a_heroPlateauSignature,
  "hero-platter.jpg": a_heroPlatter,
  "logo-produit-branding-officiel.jpg": a_logoProduitBrandingOfficiel,
  "maison-hands.jpg": a_maisonHands,
  "maison-tradition.jpg": a_maisonTradition,
  "mignardises-tulle-mariage.jpg": a_mignardisesTulleMariage,
  "p-baklawa.jpg": a_pBaklawa,
  "p-ghrayba.jpg": a_pGhrayba,
  "p-kaak-warka.jpg": a_pKaakWarka,
  "p-kaak-youyou.jpg": a_pKaakYouyou,
  "p-makroudh.jpg": a_pMakroudh,
  "p-mignardises.jpg": a_pMignardises,
  "p-samsa.jpg": a_pSamsa,
  "pastilles-pistache-chocolat.jpg": a_pastillesPistacheChocolat,
  "plateau-or-assortiment-signature.jpg": a_plateauOrAssortimentSignature,
  "wedding-buffet.jpg": a_weddingBuffet,
};

/** Liste triée pour le sélecteur de photo du backoffice. */
export const PRODUCT_ASSET_KEYS = Object.keys(PRODUCT_ASSETS).sort();

/** Résout la photo d'un produit : le téléversement prime sur la photo livrée. */
export function resolveProductImage(imageUrl?: string | null, imageKey?: string | null): string {
  if (imageUrl) return imageUrl;
  if (imageKey && PRODUCT_ASSETS[imageKey]) return PRODUCT_ASSETS[imageKey];
  return "";
}
