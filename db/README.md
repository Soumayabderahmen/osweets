# Base de données — PostgreSQL

Le site n'utilise plus Supabase. Il parle directement à **ton PostgreSQL**, via la
couche serveur `src/api` : le navigateur ne voit jamais la base, il appelle des
fonctions serveur qui, seules, connaissent la chaîne de connexion.

## Mise en route (une seule fois)

### 1. Installer les dépendances

```bash
npm install
```

`@supabase/supabase-js` a été retiré, `pg` (le pilote PostgreSQL officiel) ajouté.

### 2. Créer la base

Dans pgAdmin, sur ton serveur **PostgreSQL 15** : clic droit sur *Databases* →
*Create* → *Database…* → nom `osweets`. (Si tu l'as déjà créée, passe à l'étape 3.)

### 3. Renseigner la connexion

Dans le fichier `.env` à la racine du projet. Deux écritures au choix — la forme
détaillée :

```
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=osweets
DB_USERNAME=postgres
DB_PASSWORD=root
```

…ou l'URL complète, qui a priorité si les deux sont présentes :

```
DATABASE_URL=postgresql://postgres:root@localhost:5432/osweets
```

Attention à l'hôte : `postgres` (ou tout autre nom de service) ne fonctionne qu'à
l'intérieur de Docker. Lancé depuis Windows, c'est `localhost`.

### 4. Créer les tables et charger le catalogue

```bash
npm run db:migrate
```

Chaque fichier de `db/migrations` est joué une seule fois, dans une transaction, et
mémorisé dans la table `schema_migrations`. Relancer la commande n'applique que les
nouveautés.

| Migration | Contenu |
| --- | --- |
| `001_schema.sql` | tables `products`, `patisserie_waitlist`, `admin_users`, `admin_sessions` |
| `002_products_seed.sql` | les 27 produits Pâtisserie Tunisienne du site |

### 5. Créer ton compte d'administration

```bash
npm run db:admin -- ton@email.fr "UnMotDePasseSolide"
```

Le mot de passe est haché avec scrypt : il n'est jamais stocké en clair. Relancer la
commande avec la même adresse change simplement le mot de passe.

### 6. Démarrer

```bash
npm run dev
```

Le backoffice est sur `/admin`.

## Au quotidien

| Commande | Effet |
| --- | --- |
| `npm run db:migrate` | applique les nouvelles migrations |
| `npm run db:admin -- <email> <motdepasse>` | crée ou réinitialise un compte admin |
| `npm run db:seed` | régénère `002_products_seed.sql` depuis `src/data/products.ts` |

Pour faire évoluer le schéma : ajoute un fichier `db/migrations/003_….sql` et lance
`npm run db:migrate`. Ne modifie jamais une migration déjà appliquée.

## Ce que la base protège d'elle-même

- **Aucun produit ne peut être supprimé** : un déclencheur refuse tout `DELETE` sur
  `products`. On dépublie (`published = false`) ou on archive (`archived = true`).
- Le slug doit être en minuscules sans accent, le prix ne peut pas être négatif, et
  la pastille ne peut valoir que `bestseller`, `nouveau` ou `commande`.
- Une adresse ne peut s'inscrire qu'une fois par collection sur la liste d'attente,
  et le format de l'e-mail est vérifié côté base.

## En production

`localhost:5432` n'existe que sur ton ordinateur : un site déployé ne peut pas s'y
connecter. Pour la mise en ligne, il te faut un PostgreSQL accessible depuis
Internet (Neon, Railway, Supabase, un VPS…). Rien à changer dans le code : tu
définis `DATABASE_URL` chez l'hébergeur, et `DATABASE_SSL=require` si la connexion
impose TLS. La sauvegarde de la base devient alors ta responsabilité —
`pg_dump` régulier.
