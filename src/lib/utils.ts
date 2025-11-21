import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Member Type Labels
export const MEMBER_TYPE_LABELS = {
  ADULT: "Adulte",
  CHILD: "Enfant",
  PET: "Animal"
}

// Pet Type Labels
export const PET_TYPE_LABELS = {
  DOG: "Chien",
  CAT: "Chat",
  BIRD: "Oiseau",
  OTHER: "Autre"
}

// Event Category Labels
export const CATEGORY_LABELS = {
  WORK: "Travail",
  PERSONAL: "Personnel",
  FAMILY: "Famille",
  HEALTH: "Santé",
  EDUCATION: "Éducation",
  ENTERTAINMENT: "Loisirs",
  OTHER: "Autre"
}

// Get category color
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    WORK: "#3b82f6",
    PERSONAL: "#8b5cf6",
    FAMILY: "#ec4899",
    HEALTH: "#10b981",
    EDUCATION: "#f59e0b",
    ENTERTAINMENT: "#06b6d4",
    OTHER: "#6b7280"
  }
  return colors[category] || colors.OTHER
}

// Task Recurrence Labels
export const TASK_RECURRENCE_LABELS = {
  NONE: "Aucune",
  DAILY: "Quotidien",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel"
}

// Member Colors Palette
export const MEMBER_COLORS = [
  { value: "#7EB5E8", label: "Bleu Ciel" },        // HSL(210°, 60%, 70%) - Bleu vibrant
  { value: "#7DD4A8", label: "Vert Menthe" },      // HSL(155°, 55%, 68%) - Vert frais
  { value: "#F5D06C", label: "Jaune Soleil" },     // HSL(45°, 65%, 70%) - Jaune vif
  { value: "#F09A8F", label: "Corail" },           // HSL(10°, 70%, 75%) - Corail chaud
  { value: "#E89FCE", label: "Rose Bonbon" },      // HSL(320°, 58%, 75%) - Rose doux
  { value: "#B5A4E8", label: "Lavande" },          // HSL(250°, 60%, 75%) - Violet clair
  { value: "#78D4D0", label: "Turquoise" },        // HSL(175°, 50%, 68%) - Cyan pastel
  { value: "#F5B98F", label: "Pêche" },            // HSL(25°, 65%, 75%) - Orange doux
]
