import { MessageCircle } from "lucide-react";

const WA_URL =
  "https://wa.me/33699466030?text=" +
  encodeURIComponent("Bonjour, je souhaite avoir plus d'informations sur une commande Ö' Sweets 🍪");

export function WhatsAppFloat() {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Nous contacter sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2"
    >
      <span className="hidden group-hover:inline-block bg-white text-charbon text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
        Nous contacter
      </span>
      <span className="h-14 w-14 rounded-full grid place-items-center text-white shadow-lg hover:scale-110 transition-transform"
            style={{ background: "#25D366" }}>
        <MessageCircle className="h-6 w-6" />
      </span>
    </a>
  );
}
