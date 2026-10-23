import { useEffect, useState } from "react";
import { toast } from "sonner";

import { uploadProductImage } from "@/api/images";
import { saveCollection } from "@/api/collections";
import { savePageBanner } from "@/api/banners";
import type { Contexte } from "./core";

/**
 * Écran « Bandeaux ».
 *
 * Le bandeau, c'est la grande image en haut d'une page. Elle vivait dans le
 * code : la changer voulait dire republier le site. Ici, l'admin la remplace
 * en trois secondes, et la boutique suit.
 *
 * Deux familles, parce que le site en a deux :
 *   · les collections — chaque collection a sa page et son visuel ;
 *   · les pages — l'entrée de la Pâtisserie Tunisienne, les événements,
 *     les cadeaux, qui ne sont pas des collections.
 */
export function EcranBandeaux({ ctx }: { ctx: Contexte }) {
  return (
    <>
      <div className="note">
        Le bandeau, c'est la <b>grande image en haut d'une page</b>. Changez-la ici : la boutique
        suit tout de suite, sans republier le site.
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Bandeaux des collections</h3>
        <div className="sub">L'image affichée en haut de chaque page collection.</div>
        <div className="bandeaux">
          {ctx.collections.map((c) => (
            <Vignette
              key={c.id}
              titre={c.label}
              sous={`/patisserie/${c.slug}`}
              image={c.image_url ?? ""}
              onImage={async (url) => {
                await saveCollection({
                  data: { id: c.id, values: { image_url: url } },
                });
              }}
              recharger={ctx.recharger}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Bandeaux des pages</h3>
        <div className="sub">
          Les pages qui ne sont pas des collections : l'entrée de la boutique, les événements, les
          cadeaux.
        </div>
        {ctx.bandeaux.length === 0 ? (
          <div className="empty">Aucun bandeau enregistré.</div>
        ) : (
          <div className="bandeaux">
            {ctx.bandeaux.map((b) => (
              <div key={b.key} style={{ display: "grid", gap: 12 }}>
                <Vignette
                  titre={b.label || b.key}
                  sous={b.key}
                  image={b.image_url}
                  onImage={async (url) => {
                    await savePageBanner({ data: { key: b.key, imageUrl: url } });
                  }}
                  recharger={ctx.recharger}
                />
                <TexteBandeau row={b} recharger={ctx.recharger} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function TexteBandeau({
  row,
  recharger,
}: {
  row: Contexte["bandeaux"][number];
  recharger: () => Promise<void>;
}) {
  const [title, setTitle] = useState(row.title);
  const [subtitle, setSubtitle] = useState(row.subtitle);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(row.title);
    setSubtitle(row.subtitle);
  }, [row.title, row.subtitle]);

  const enregistrer = async () => {
    setBusy(true);
    try {
      await savePageBanner({ data: { key: row.key, title, subtitle } });
      await recharger();
      toast.success("Texte du bandeau enregistré.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <label className="f">
        <span>Titre affiché</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="f">
        <span>Texte sous le titre</span>
        <textarea rows={3} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </label>
      <button type="button" className="btn-dark" disabled={busy} onClick={() => void enregistrer()}>
        {busy ? "Enregistrement…" : "Enregistrer le texte"}
      </button>
    </div>
  );
}

/**
 * Une vignette : l'image telle qu'elle est aujourd'hui, et de quoi la
 * remplacer. On montre le résultat plutôt qu'un nom de fichier — c'est
 * l'image que la cliente verra.
 */
function Vignette({
  titre,
  sous,
  image,
  onImage,
  recharger,
}: {
  titre: string;
  sous: string;
  image: string;
  onImage: (url: string) => Promise<void>;
  recharger: () => Promise<void>;
}) {
  const [envoi, setEnvoi] = useState(false);

  const televerser = async (file: File) => {
    setEnvoi(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1] ?? "");
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { url } = await uploadProductImage({
        data: { fileName: file.name, contentType: file.type, base64 },
      });
      await onImage(url);
      await recharger();
      toast.success("Bandeau remplacé.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible.");
    }
    setEnvoi(false);
  };

  return (
    <div className="bandeau">
      <div className="bandeau-img">
        {image ? <img src={image} alt="" /> : <span className="bandeau-vide">Aucune image</span>}
      </div>
      <div className="bandeau-txt">
        <strong>{titre}</strong>
        <span>{sous}</span>
      </div>
      <label className="btn btn-ghost bandeau-btn">
        {envoi ? "Envoi…" : image ? "Remplacer" : "Choisir une image"}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          disabled={envoi}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void televerser(f);
          }}
        />
      </label>
    </div>
  );
}
