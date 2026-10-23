-- ════════════════════════════════════════════════════════════════════
--  012 — Les anciennes adresses de fiches passent en base
--
--  La migration 011 a posé la table et le déclencheur : renommer un
--  produit depuis le back-office mémorise désormais son ancienne adresse
--  tout seul. Restait le passé — onze redirections écrites à la main dans
--  `patisserie.ts`, ajoutées une par une par un développeur.
--
--  On les reprend ici, une fois, et le fichier peut disparaître. À partir
--  de maintenant, aucun renommage ne demandera plus une ligne de code.
--
--  L'insertion passe par une jointure sur `products` : une cible qui
--  n'existe plus n'entre pas. Une redirection vers le vide vaut moins
--  qu'une page absente — elle promet quelque chose qu'elle ne tient pas.
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.product_slug_history (old_slug, product_id)
SELECT v.ancien, p.id
  FROM (VALUES
    ('ghrayba-amandes',  'ghraiba'),
    ('samsa-praline',    'samsa-praline-noisette'),
    ('samsa-pistache',   'samsa-praline-pistache'),
    -- La fiche kounefa à sélecteur est devenue une fiche par parfum.
    ('kounefa',          'kounefa-pistache'),
    ('kounafa-pistache', 'kounefa-pistache'),
    ('kounefa-nutella',  'kounefa-chocolat'),
    ('bachkoutou',       'bechkoutou'),
    ('kaak-youyou',      'youyou'),
    ('sable-tunisien',   'sable'),
    ('hrissa-louz',      'hrisset-louz'),
    ('degla-farcie',     'dattes-farcies')
  ) AS v(ancien, cible)
  JOIN public.products p ON p.slug = v.cible
 WHERE NOT EXISTS (SELECT 1 FROM public.products x WHERE x.slug = v.ancien)
ON CONFLICT (old_slug) DO NOTHING;
