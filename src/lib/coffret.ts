/**
 * Prix d'un coffret composé. Une seule formule, lue par la page /composer et
 * par le serveur au moment de la commande.
 */
const UNIT_PRICE = 3.5;

export const boxPrice = (pieces: number) =>
  pieces * UNIT_PRICE + (pieces >= 36 ? 15 : pieces >= 24 ? 8 : pieces >= 18 ? 5 : 0);

/** « box-12 » → 12, ou `null` si ce n'est pas un coffret composé. */
export function boxPieces(slug: string): number | null {
  const m = slug.match(/^box-(6|12|18|24|36|48)$/);
  return m ? Number(m[1]) : null;
}
