import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  changePassword,
  listSessions,
  revokeSession,
  updateProfile,
  type AdminIdentity,
  type AdminSession,
} from "@/api/auth";
import { Ic, useV2 } from "./ui";

/** Même règle que le serveur (src/api/session.ts). */
const MIN = 10;

export const initiales = (nom: string | null | undefined, email: string) =>
  (
    (nom || email.split("@")[0])
      .replace(/[^a-zà-ÿ\s]/gi, " ")
      .trim()
      .split(/\s+/)
      .map((m) => m[0])
      .join("")
      .slice(0, 2) || "ÖS"
  ).toUpperCase();

/** « Chrome sur Windows », « Safari sur iPhone »… à partir du navigateur enregistré. */
function appareil(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  const nav = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navigateur";
  const sys = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  return sys ? `${nav} sur ${sys}` : nav;
}

const quand = (iso: string) => {
  const d = new Date(iso);
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 6) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function EcranProfil({
  admin,
  onChange,
}: {
  admin: AdminIdentity;
  onChange: (a: AdminIdentity) => void;
}) {
  const { message } = useV2();
  const [nom, setNom] = useState(admin.displayName ?? "");
  const [email, setEmail] = useState(admin.email);
  const [busyProfil, setBusyProfil] = useState(false);
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirme: "" });
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [busyMdp, setBusyMdp] = useState(false);
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);

  const chargerSessions = useCallback(async () => {
    try {
      setSessions(await listSessions());
    } catch {
      setSessions([]);
    }
  }, []);
  useEffect(() => {
    void chargerSessions();
  }, [chargerSessions]);

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setBusyProfil(true);
    try {
      const a = await updateProfile({ data: { displayName: nom, email } });
      onChange(a);
      message("Profil enregistré");
    } catch (err) {
      message(err instanceof Error ? err.message : "Profil non enregistré.");
    }
    setBusyProfil(false);
  };

  const changer = async (e: FormEvent) => {
    e.preventDefault();
    setErreurMdp(null);
    if (mdp.nouveau.length < MIN) return setErreurMdp(`Au moins ${MIN} caractères.`);
    if (mdp.nouveau !== mdp.confirme)
      return setErreurMdp("Les deux nouveaux mots de passe ne sont pas identiques.");
    setBusyMdp(true);
    try {
      await changePassword({ data: { current: mdp.actuel, next: mdp.nouveau } });
      setMdp({ actuel: "", nouveau: "", confirme: "" });
      await chargerSessions();
      message("Mot de passe changé — les autres appareils sont déconnectés");
    } catch (err) {
      setErreurMdp(err instanceof Error ? err.message : "Mot de passe non changé.");
    }
    setBusyMdp(false);
  };

  const fermer = async (id: string) => {
    try {
      await revokeSession({ data: { id } });
      await chargerSessions();
      message(id === "autres" ? "Les autres appareils sont déconnectés" : "Appareil déconnecté");
    } catch (err) {
      message(err instanceof Error ? err.message : "Déconnexion impossible.");
    }
  };

  const autres = (sessions ?? []).filter((s) => !s.current);

  return (
    <>
      <div className="entete">
        <div>
          <h1 className="titre">Mon profil</h1>
          <p>Votre compte pour vous connecter à l'admin.</p>
        </div>
      </div>
      <div className="reglages">
        <form className="carte bloc" onSubmit={enregistrer}>
          <div className="profil-tete">
            <span className="avatar grand">{initiales(admin.displayName, admin.email)}</span>
            <div>
              <b>{admin.displayName || "Ö' Sweets"}</b>
              <small>{admin.email}</small>
              <span className="etiq-role">Administratrice</span>
            </div>
          </div>
          <div className="champ">
            <label htmlFor="profil-nom">Nom affiché</label>
            <input
              id="profil-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ö' Sweets"
              maxLength={80}
            />
            <span className="aide">Affiché en bas du menu et en haut à droite.</span>
          </div>
          <div className="champ">
            <label htmlFor="profil-email">Adresse e-mail de connexion</label>
            <input
              id="profil-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <span className="aide">C'est avec elle que vous vous connectez.</span>
          </div>
          <div className="fin-carte">
            <button type="submit" className="btn principal" disabled={busyProfil}>
              <Ic n="check" /> {busyProfil ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>

        <form className="carte bloc" onSubmit={changer}>
          <h2 className="titre">Mot de passe</h2>
          <p className="sous">Au moins {MIN} caractères, différent de celui de vos autres sites.</p>
          <div className="champ">
            <label htmlFor="mdp-actuel">Mot de passe actuel</label>
            <input
              id="mdp-actuel"
              type="password"
              required
              autoComplete="current-password"
              value={mdp.actuel}
              onChange={(e) => setMdp({ ...mdp, actuel: e.target.value })}
            />
          </div>
          <div className="champ">
            <label htmlFor="mdp-nouveau">Nouveau mot de passe</label>
            <input
              id="mdp-nouveau"
              type="password"
              required
              autoComplete="new-password"
              value={mdp.nouveau}
              onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })}
            />
          </div>
          <div className="champ">
            <label htmlFor="mdp-confirme">Confirmer le nouveau</label>
            <input
              id="mdp-confirme"
              type="password"
              required
              autoComplete="new-password"
              value={mdp.confirme}
              onChange={(e) => setMdp({ ...mdp, confirme: e.target.value })}
            />
          </div>
          {erreurMdp && (
            <div className="conseil" style={{ borderLeftColor: "#ea0606" }}>
              <Ic n="info" />
              <span>{erreurMdp}</span>
            </div>
          )}
          <div className="fin-carte">
            <button type="submit" className="btn principal" disabled={busyMdp}>
              <Ic n="check" /> {busyMdp ? "Changement…" : "Changer le mot de passe"}
            </button>
          </div>
        </form>

        <div className="carte bloc">
          <h2 className="titre">Où je suis connectée</h2>
          <p className="sous">Les appareils ouverts sur votre compte.</p>
          {sessions === null ? (
            <p className="sous">Chargement…</p>
          ) : (
            <>
              {sessions.map((s) => (
                <div className="ligne-reglage" key={s.id}>
                  <div>
                    <b>{appareil(s.userAgent)}</b>
                    <small>
                      {s.current ? "Cet appareil · " : ""}dernière visite {quand(s.lastSeenAt)}
                    </small>
                  </div>
                  {s.current ? (
                    <span className="etiq-role vert">En cours</span>
                  ) : (
                    <button
                      type="button"
                      className="btn second petit"
                      onClick={() => void fermer(s.id)}
                    >
                      Déconnecter
                    </button>
                  )}
                </div>
              ))}
              {autres.length > 0 && (
                <div className="ligne-reglage">
                  <div>
                    <b>Tous les autres appareils</b>
                    <small>Utile si vous avez perdu un téléphone.</small>
                  </div>
                  <button
                    type="button"
                    className="btn danger petit"
                    onClick={() => void fermer("autres")}
                  >
                    Tout déconnecter
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
