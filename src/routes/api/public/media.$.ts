import { createFileRoute } from "@tanstack/react-router";

/**
 * Sert les photos téléversées depuis le back-office.
 * Elles sont stockées dans PostgreSQL (table `media_files`) : aucun
 * service externe, et la sauvegarde de la base emporte les images.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
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

        return new Response(new Uint8Array(row.bytes), {
          headers: {
            "content-type": row.content_type || "image/jpeg",
            "content-length": String(row.bytes.byteLength),
            // Le nom du fichier est unique à chaque téléversement : on peut
            // laisser les navigateurs le garder indéfiniment.
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
