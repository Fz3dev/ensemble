"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, Plus, CalendarDays, CheckCircle2, Lock } from "lucide-react"
import { FadeIn, ScaleIn } from "@/components/animations"
import { TEXTS } from "@/lib/constants/texts"
import Link from "next/link"
import { useState, useRef } from "react"
import { EventDetailsDrawer } from "@/components/event-details-drawer"
import { SwipeableEventCard } from "@/components/swipeable-event-card"
import { deleteEvent } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DashboardEventsProps {
    nextEvent: any
    upcomingEvents: any[]
    members: any[]
    householdId: string
}

export function DashboardEvents({ nextEvent, upcomingEvents, members, householdId }: DashboardEventsProps) {
    const router = useRouter()
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [deletedEventIds, setDeletedEventIds] = useState<Set<string>>(new Set())
    const pendingDeletes = useRef<Record<string, NodeJS.Timeout>>({})

    const handleEventClick = (event: any) => {
        setSelectedEvent(event)
        setIsDrawerOpen(true)
    }

    const handleDelete = (eventId: string) => {
        // Optimistically hide the event
        setDeletedEventIds(prev => {
            const newSet = new Set(prev)
            newSet.add(eventId)
            return newSet
        })

        // Schedule actual deletion
        const timeoutId = setTimeout(async () => {
            await deleteEvent(eventId, false) // Default to single delete for swipe
            router.refresh()
            delete pendingDeletes.current[eventId]
        }, 4000)

        pendingDeletes.current[eventId] = timeoutId

        // Show Toast with Undo
        toast(TEXTS.event.deleteSingle || "Événement supprimé", {
            action: {
                label: TEXTS.common.cancel || "Annuler",
                onClick: () => handleUndo(eventId)
            },
            duration: 3500,
        })
    }

    const handleUndo = (eventId: string) => {
        // Clear timeout
        const timeoutId = pendingDeletes.current[eventId]
        if (timeoutId) {
            clearTimeout(timeoutId)
            delete pendingDeletes.current[eventId]
        }

        // Restore UI
        setDeletedEventIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(eventId)
            return newSet
        })
    }

    // Filter out deleted events for display
    const visibleUpcomingEvents = upcomingEvents.filter(e => !deletedEventIds.has(e.id))

    // Get the color of the participants
    const participants = nextEvent?.participants || []
    const color1 = participants[0]?.member?.color
    const color2 = participants[1]?.member?.color

    // Determine background style
    let backgroundStyle = {}
    if (nextEvent) {
        if (color1 && color2) {
            backgroundStyle = { background: `linear-gradient(135deg, ${color1}, ${color2})` }
        } else if (color1) {
            backgroundStyle = { background: `linear-gradient(135deg, ${color1}, ${color1}dd)` }
        }
    }

    // Check if we have a custom background (from participants)
    const hasCustomBackground = Object.keys(backgroundStyle).length > 0

    // Default classes when no participants (Light/Off-white style)
    const defaultClasses = "bg-white dark:bg-card text-foreground border-2 border-muted/20"
    // Custom classes when participants exist (Colored/Gradient style)
    const customClasses = "text-white shadow-xl shadow-primary/20"

    return (
        <>
            {/* Hero Card - Next Event */}
            <ScaleIn delay={0.1}>
                <div
                    className={`relative overflow-hidden rounded-3xl ${nextEvent ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${hasCustomBackground ? customClasses : defaultClasses}`}
                    style={backgroundStyle}
                    onClick={() => nextEvent && handleEventClick(nextEvent)}
                >
                    {/* Background decorations - only show for custom gradient to avoid cluttering the light card */}
                    {hasCustomBackground && (
                        <>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
                        </>
                    )}

                    <div className="relative p-6 sm:p-8">
                        <div className={`flex items-center space-x-2 mb-4 ${hasCustomBackground ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">{TEXTS.dashboard.nextEvent}</span>
                        </div>

                        {nextEvent ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                                        {nextEvent.title}
                                    </h2>
                                    {nextEvent.visibility === 'PARTICIPANTS' && (
                                        <Lock className={`w-6 h-6 ${hasCustomBackground ? 'text-white/80' : 'text-muted-foreground'}`} />
                                    )}
                                </div>
                                <div className="flex items-center space-x-4 text-lg opacity-90">
                                    <div className={`backdrop-blur-md px-4 py-2 rounded-xl ${hasCustomBackground ? 'bg-white/20' : 'bg-primary/10 text-primary font-semibold'}`}>
                                        {format(new Date(nextEvent.startTime), "HH:mm") === "00:00" && format(new Date(nextEvent.endTime), "HH:mm") === "23:59"
                                            ? "Toute la journée"
                                            : format(new Date(nextEvent.startTime), "HH:mm")
                                        }
                                    </div>
                                    <span>
                                        {format(new Date(nextEvent.startTime), "EEEE d", { locale: fr })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center opacity-80">
                                <p className="text-xl">{TEXTS.calendar.noEvents}</p>
                                <Button
                                    variant="secondary"
                                    className={`mt-4 border-0 ${hasCustomBackground ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link href={`/household/${householdId}/calendar/new`}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {TEXTS.calendar.addEvent}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </ScaleIn>

            {/* Upcoming Events List */}
            {visibleUpcomingEvents.length > 0 && (
                <FadeIn delay={0.15}>
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground px-1">{TEXTS.dashboard.upNext}</h3>
                        {visibleUpcomingEvents.map((event) => {
                            const participants = event.participants || []
                            const pColors = participants.map((p: any) => p.member?.color).filter(Boolean)

                            // Determine gradient or single color
                            const isGradient = pColors.length > 1
                            const gradient = isGradient ? `linear-gradient(to bottom, ${pColors[0]}, ${pColors[1]})` : null
                            const singleColor = pColors.length === 1 ? pColors[0] : null

                            const backgroundStyle = isGradient
                                ? { background: gradient || undefined }
                                : { backgroundColor: singleColor || "transparent" }

                            return (
                                <SwipeableEventCard key={event.id} onDelete={() => handleDelete(event.id)}>
                                    <div
                                        className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm transition-transform hover:scale-[1.01]"
                                        style={{
                                            ...backgroundStyle,
                                            paddingLeft: '6px', // The left strip width
                                            paddingTop: '1px',
                                            paddingRight: '1px',
                                            paddingBottom: '1px',
                                        }}
                                        onClick={() => handleEventClick(event)}
                                    >
                                        <div className="h-full w-full bg-white dark:bg-card rounded-r-[11px] rounded-l-[6px] group-hover:bg-gray-50 dark:group-hover:bg-muted/50 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between h-full">
                                                <div className="flex flex-col items-center min-w-[3rem] text-sm">
                                                    <span className="font-bold text-gray-900 dark:text-foreground">
                                                        {format(new Date(event.startTime), "HH:mm") === "00:00" && format(new Date(event.endTime), "HH:mm") === "23:59"
                                                            ? "Toute"
                                                            : format(new Date(event.startTime), "HH:mm")
                                                        }
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(event.startTime), "dd/MM")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-foreground">{event.title}</span>
                                                    {event.visibility === 'PARTICIPANTS' && (
                                                        <Lock className="w-3 h-3 text-muted-foreground/70" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </div>
                                    </div>
                                </SwipeableEventCard>
                            )
                        })}
                    </div>
                </FadeIn>
            )}

            <EventDetailsDrawer
                event={selectedEvent}
                members={members}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </>
    )
}
