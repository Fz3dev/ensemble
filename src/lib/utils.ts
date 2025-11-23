import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MEMBER_COLORS = [
  { name: "Bleu Ciel", value: "#38bdf8" },
  { name: "Vert Menthe", value: "#4ade80" },
  { name: "Rose Bonbon", value: "#f472b6" },
  { name: "Jaune Soleil", value: "#facc15" },
  { name: "Orange Corail", value: "#fb923c" },
  { name: "Violet Lavande", value: "#a78bfa" },
  { name: "Rouge Cerise", value: "#f87171" },
  { name: "Gris Perle", value: "#94a3b8" },
]

export const CATEGORY_LABELS: Record<string, string> = {
  CHORES: "Tâches ménagères",
  APPOINTMENT: "Rendez-vous",
  SCHOOL: "École",
  ACTIVITY: "Activité",
  MEAL: "Repas",
  OTHER: "Autre",
  WORK: "Travail",
  SHOPPING: "Courses",
  HEALTH: "Santé",
  FINANCE: "Finance",
  TRAVEL: "Voyage",
  SOCIAL: "Social",
  EDUCATION: "Éducation",
}

export const PET_TYPE_LABELS: Record<string, string> = {
  DOG: "Chien",
  CAT: "Chat",
  BIRD: "Oiseau",
  FISH: "Poisson",
  RODENT: "Rongeur",
  REPTILE: "Reptile",
  OTHER: "Autre",
}

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  ADULT: "Adulte",
  CHILD: "Enfant",
  PET: "Animal",
  OTHER: "Autre",
}

export const TASK_RECURRENCE_LABELS: Record<string, string> = {
  NONE: "Aucune",
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
}

export function generateGoogleCalendarLink(event: {
  title: string
  startTime: Date
  endTime: Date
  description?: string | null
  location?: string | null
}) {
  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "")

  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.append("action", "TEMPLATE")
  url.searchParams.append("text", event.title)
  url.searchParams.append("dates", `${formatDate(event.startTime)}/${formatDate(event.endTime)}`)

  if (event.description) {
    url.searchParams.append("details", event.description)
  }

  if (event.location) {
    url.searchParams.append("location", event.location)
  }

  return url.toString()
}

export function generateICSFile(event: {
  title: string
  startTime: Date
  endTime: Date
  description?: string | null
  location?: string | null
}) {
  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "")

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\n")

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  return URL.createObjectURL(blob)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback for non-secure contexts or older browsers
    try {
      const textArea = document.createElement("textarea")
      textArea.value = text

      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      textArea.style.top = "0"
      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err)
      return false
    }
  }

  // Modern API
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Async: Could not copy text: ', err)
    return false
  }
}
