import { createFileRoute } from "@tanstack/react-router";

/**
 * Sert les photos téléversées depuis le back-office.
 * Elles sont stockées dans PostgreSQL (table `media_files`) : aucun
 * service externe, et la sauvegarde de la base emporte les images.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || !/^[A-Za-z0-9._-]+$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }

        const { queryOne } = await import("@/api/db");
        const row = await queryOne<{ bytes: Buffer; content_type: string }>(
          "SELECT bytes, content_type FROM public.media_files WHERE path = $1",
          [path],
        ).catch(() => null);

        if (!row) return new Response("Not found", { status: 404 });

        /*
         * Empreinte du CONTENU, pas du nom.
         *
         * Les photos téléversées portent un nom unique, mais celles livrées
         * avec la boutique (p-samsa.jpg, bandeau-…) gardent le leur quand on
         * remplace le fichier. Avec l'ancien `immutable` d'un an, une photo
         * refaite restait invisible pendant des mois chez les clientes déjà
         * venues. L'empreinte règle ça : le navigateur garde l'image, pose
         * une question courte au retour, et reçoit un 304 vide tant que rien
         * n'a changé — le gain du cache sans son effet de bord.
         */
        const { createHash } = await import("node:crypto");
        const etag = `"${createHash("sha1").update(row.bytes).digest("base64url")}"`;
        const cache = "public, max-age=86400, stale-while-revalidate=604800";

        if (request.headers.get("if-none-match") === etag) {
          return new Response(null, { status: 304, headers: { etag, "cache-control": cache } });
        }

        return new Response(new Uint8Array(row.bytes), {
          headers: {
            "content-type": row.content_type || "image/jpeg",
            "content-length": String(row.bytes.byteLength),
            "cache-control": cache,
            etag,
          },
        });
      },
    },
  },
});
