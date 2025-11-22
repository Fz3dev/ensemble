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

  LEISURE: "Loisirs",
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
    LEISURE: "#06b6d4",
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

// Calendar Export Helpers
export function generateGoogleCalendarLink(event: { title: string, description?: string, startTime: Date | string, endTime: Date | string, location?: string }) {
  const start = new Date(event.startTime).toISOString().replace(/-|:|\.\d+/g, "")
  const end = new Date(event.endTime).toISOString().replace(/-|:|\.\d+/g, "")

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || "",
    location: event.location || "",
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateICSFile(event: { title: string, description?: string, startTime: Date | string, endTime: Date | string, location?: string }) {
  const start = new Date(event.startTime).toISOString().replace(/-|:|\.\d+/g, "")
  const end = new Date(event.endTime).toISOString().replace(/-|:|\.\d+/g, "")

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ensemble//App//FR",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ""}`,
    `LOCATION:${event.location || ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n")

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  return URL.createObjectURL(blob)
}

// Robust Copy to Clipboard (works in non-secure contexts)
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      throw new Error("Clipboard API unavailable")
    }
  } catch (err) {
    // Fallback for non-secure contexts (e.g. local dev via IP)
    try {
      const textArea = document.createElement("textarea")
      textArea.value = text

      // Ensure it's not visible but part of DOM
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      textArea.style.top = "0"
      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      return successful
    } catch (fallbackErr) {
      console.error("Copy failed:", fallbackErr)
      return false
    }
  }
}
