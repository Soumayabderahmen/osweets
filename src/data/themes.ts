// Thèmes & options pour gâteaux personnalisés
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import samsa from "@/assets/p-samsa.jpg";
import ghrayba from "@/assets/p-ghrayba.jpg";
import baklawa from "@/assets/p-baklawa.jpg";
import wedding from "@/assets/wedding-buffet.jpg";

export type ThemeCategory = "age" | "motif" | "occasion";

export interface CakeTheme {
  id: string;
  label: string;
  emoji: string;
  color: string;
  category: ThemeCategory;
  image: string;
}

export const cakeThemes: CakeTheme[] = [
  // Motifs
  { id: "reine-des-neiges", label: "Reine des Neiges", emoji: "❄️", color: "#A8D8F0", category: "motif", image: cakeVanille },
  { id: "licorne", label: "Licorne", emoji: "🦄", color: "#F8BBD0", category: "motif", image: cakePistache },
  { id: "princesse", label: "Princesse", emoji: "👑", color: "#F4C2C2", category: "motif", image: cakeCitron },
  { id: "super-heros", label: "Super-héros", emoji: "🦸", color: "#E53935", category: "motif", image: cakeChocolat },
  { id: "spider-man", label: "Spider-Man", emoji: "🕷️", color: "#E53935", category: "motif", image: cakeChocolat },
  { id: "voiture", label: "Voitures & Cars", emoji: "🏎️", color: "#1565C0", category: "motif", image: cakeNoisette },
  { id: "football", label: "Football", emoji: "⚽", color: "#2E7D32", category: "motif", image: cakePistache },
  { id: "fleurs", label: "Fleurs", emoji: "🌸", color: "#E8B4B8", category: "motif", image: mignardises },
  { id: "animaux", label: "Animaux", emoji: "🐻", color: "#A89152", category: "motif", image: ghrayba },
  // Âge / genre
  { id: "enfant-garcon", label: "Enfant garçon", emoji: "👦", color: "#90CAF9", category: "age", image: cakeNoisette },
  { id: "enfant-fille", label: "Enfant fille", emoji: "👧", color: "#F8BBD0", category: "age", image: cakePistache },
  { id: "ado", label: "Ado", emoji: "🎮", color: "#9575CD", category: "age", image: cakeChocolat },
  { id: "adulte", label: "Adulte", emoji: "✨", color: "#A89152", category: "age", image: cakeCitron },
  // Occasion
  { id: "premier-anniversaire", label: "1er Anniversaire", emoji: "🎂", color: "#F4C2C2", category: "occasion", image: mignardises },
  { id: "baby-shower", label: "Baby Shower", emoji: "👶", color: "#B3E5FC", category: "occasion", image: samsa },
  { id: "anniversaire-mariage", label: "Anniversaire de mariage", emoji: "💍", color: "#A89152", category: "occasion", image: wedding },
  { id: "personnalise", label: "Sur mesure", emoji: "🎨", color: "#A89152", category: "occasion", image: baklawa },
];

export const cakeSizes = [
  { id: "16", diameter: "16 cm", parts: 4, price: 45 },
  { id: "20", diameter: "20 cm", parts: 8, price: 65 },
  { id: "24", diameter: "24 cm", parts: 12, price: 95 },
  { id: "28", diameter: "28 cm", parts: 20, price: 145 },
  { id: "32", diameter: "32 cm", parts: 30, price: 195 },
  { id: "etage", diameter: "Pièce montée 2 étages", parts: 40, price: 290 },
  { id: "etage3", diameter: "Pièce montée 3 étages", parts: 70, price: 480 },
];

export const cakeFlavors = [
  { id: "chocolat", label: "Chocolat Noir 70%" },
  { id: "vanille", label: "Vanille Bourbon" },
  { id: "fraise", label: "Fraise & Crème Vanille" },
  { id: "pistache", label: "Pistache & Fleur d'Oranger" },
  { id: "citron", label: "Citron Confit & Mascarpone" },
  { id: "framboise", label: "Framboise & Chocolat Blanc" },
  { id: "caramel", label: "Caramel Beurre Salé" },
  { id: "moka", label: "Moka Praliné" },
];
