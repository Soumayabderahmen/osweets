import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WaitlistFormProps {
  /** Identifiant de la collection ou du produit concerné. */
  collection: string;
  className?: string;
  compact?: boolean;
}

/** Champ e-mail « Prévenez-moi » — enregistré dans la base. */
export function WaitlistForm({ collection, className = "", compact }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.error("Merci de saisir une adresse e-mail valide.");
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from("patisserie_waitlist")
      .insert({ email: value, collection });
    setSending(false);

    if (error && error.code !== "23505") {
      toast.error("Enregistrement impossible pour le moment. Réessayez dans un instant.");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success("C'est noté — nous vous préviendrons dès l'ouverture.");
  };

  if (done) {
    return (
      <p className={`text-sm text-charbon/75 ${className}`}>
        Merci ! Votre adresse est enregistrée, nous vous écrirons dès que cette sélection sera en ligne.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={`flex flex-col gap-2 sm:flex-row ${className}`}>
      <label className="sr-only" htmlFor={`waitlist-${collection}`}>
        Votre adresse e-mail
      </label>
      <input
        id={`waitlist-${collection}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.fr"
        className={`min-w-0 flex-1 border border-border bg-white px-3 text-sm outline-none focus:border-gold ${compact ? "py-2" : "py-3"}`}
      />
      <button
        type="submit"
        disabled={sending}
        className={`shrink-0 bg-charbon px-5 text-[11px] uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-gold disabled:opacity-50 ${compact ? "py-2.5" : "py-3"}`}
      >
        {sending ? "Envoi…" : "Prévenez-moi"}
      </button>
    </form>
  );
}
