"use client"

import { useState, useRef } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { EventDetailsDrawer } from "@/components/event-details-drawer"
import { FadeIn } from "@/components/animations"
import { Clock } from "lucide-react"
import { TEXTS } from "@/lib/constants/texts"
import { getCategoryColor } from "@/lib/utils"
import { SwipeableEventCard } from "@/components/swipeable-event-card"
import { deleteEvent } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EventListProps {
    events: any[]
    members: any[]
}

export function EventList({ events, members }: EventListProps) {
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
            duration: 3500, // Slightly less than the timeout
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
    const visibleEvents = events.filter(e => !deletedEventIds.has(e.id))

    return (
        <>
            <div className="space-y-3">
                {visibleEvents.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">{TEXTS.calendar.noEvents}</p>
                ) : (
                    visibleEvents.map((event, i) => {
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
                            <FadeIn key={event.id} delay={i * 0.05}>
                                <SwipeableEventCard onDelete={() => handleDelete(event.id)}>
                                    <div
                                        className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm transition-transform hover:scale-[1.01]"
                                        style={{
                                            ...backgroundStyle,
                                            paddingLeft: '6px',
                                            paddingTop: '1px',
                                            paddingRight: '1px',
                                            paddingBottom: '1px',
                                        }}
                                        onClick={() => handleEventClick(event)}
                                    >
                                        <div className="h-full w-full bg-white rounded-r-[11px] rounded-l-[6px] group-hover:bg-gray-50 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between h-full">
                                                <div>
                                                    <h4 className="font-medium">{event.title}</h4>
                                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {format(new Date(event.startTime), "HH:mm") === "00:00" && format(new Date(event.endTime), "HH:mm") === "23:59"
                                                            ? "Toute la journée"
                                                            : `${format(new Date(event.startTime), "HH:mm")} - ${format(new Date(event.endTime), "HH:mm")}`
                                                        }
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </div>
                                    </div>
                                </SwipeableEventCard>
                            </FadeIn>
                        )
                    })
                )}
            </div>

            <EventDetailsDrawer
                event={selectedEvent}
                members={members}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </>
    )
}
