-- ════════════════════════════════════════════════════════════════════
--  010 — Renomme le bandeau « patisserie-produit »
--
--  Pourquoi une migration en plus, alors que 009 a été corrigée ?
--
--  Parce qu'une migration déjà appliquée ne se rejoue pas. Le journal
--  `schema_migrations` retient 009 comme faite ; modifier son fichier
--  ensuite ne change rien à une base qui l'a déjà passée — elle répond
--  « déjà à jour » et garde l'ancienne clé. Une base neuve aurait la
--  nouvelle, une base existante l'ancienne : deux vérités selon l'âge de
--  l'installation. C'est exactement ce qu'une migration séparée existe
--  pour éviter.
--
--  La clé `patisserie-produit` était doublement fausse : son nom parlait
--  d'une fiche produit alors qu'elle sert de visuel par défaut aux
--  collections sans image, et le code ne la lisait pas — c'était un
--  bouton du back-office qui ne commandait rien.
-- ════════════════════════════════════════════════════════════════════

-- Le cas normal : l'ancienne clé existe seule, on la renomme en gardant
-- son image et sa date. Rien n'est perdu, rien n'est retéléversé.
UPDATE public.page_banners
   SET key   = 'patisserie-collection-defaut',
       label = 'Collection sans visuel — image par défaut'
 WHERE key = 'patisserie-produit'
   AND NOT EXISTS (
         SELECT 1 FROM public.page_banners
          WHERE key = 'patisserie-collection-defaut'
       );

-- Le cas des deux lignes : une base neuve a reçu la bonne clé par la 009
-- corrigée, et traîne peut-être aussi l'ancienne. On garde la nouvelle,
-- en lui reprenant l'image de l'ancienne si elle n'en avait pas.
UPDATE public.page_banners AS n
   SET image_url = a.image_url,
       image_key = a.image_key
  FROM public.page_banners AS a
 WHERE n.key = 'patisserie-collection-defaut'
   AND a.key = 'patisserie-produit'
   AND n.image_url = ''
   AND a.image_url <> '';

DELETE FROM public.page_banners
 WHERE key = 'patisserie-produit'
   AND EXISTS (
         SELECT 1 FROM public.page_banners
          WHERE key = 'patisserie-collection-defaut'
       );

-- Le cas d'une base qui n'aurait ni l'une ni l'autre : on crée la ligne
-- vide, pour que l'écran Bandeaux la propose au lieu de la taire.
INSERT INTO public.page_banners (key, label, image_key)
VALUES (
  'patisserie-collection-defaut',
  'Collection sans visuel — image par défaut',
  'plateau-or-assortiment-signature.jpg'
)
ON CONFLICT (key) DO NOTHING;

-- Le libellé, même si la clé était déjà la bonne mais mal étiquetée.
UPDATE public.page_banners
   SET label = 'Collection sans visuel — image par défaut'
 WHERE key = 'patisserie-collection-defaut'
   AND label <> 'Collection sans visuel — image par défaut';
