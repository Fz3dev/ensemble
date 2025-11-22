import { CalendarClient } from "@/components/calendar-client"
import { EventList } from "@/components/event-list"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { TEXTS } from "@/lib/constants/texts"
import { MemberFilter } from "@/components/member-filter"
import { CreateEventButton } from "@/components/create-event-button"

export default async function CalendarPage({
    params,
    searchParams,
}: {
    params: { householdId: string }
    searchParams: { date?: string; members?: string }
}) {
    const session = await auth()
    if (!session?.user) return null

    const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
    const memberIds = searchParams.members?.split(",") || []

    // Build where clause for events
    const whereClause: any = {
        householdId: params.householdId,
    }

    if (memberIds.length > 0) {
        whereClause.participants = {
            some: {
                memberId: {
                    in: memberIds
                }
            }
        }
    }

    const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { startTime: "asc" },
        include: {
            series: true,
            participants: {
                include: {
                    member: true
                }
            }
        }
    })

    const selectedEvents = events.filter((event: any) => {
        const eventDate = new Date(event.startTime)
        return (
            eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
        )
    })

    const members = await prisma.member.findMany({
        where: { householdId: params.householdId },
        include: { user: true }
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{TEXTS.navigation.calendar}</h2>
                <div className="flex items-center gap-2">
                    <MemberFilter members={members} />
                    <CreateEventButton householdId={params.householdId} members={members} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="flex flex-col gap-4">
                    <CalendarClient events={events} />
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg capitalize">
                        {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                    </h3>
                    <EventList events={selectedEvents} members={members} />
                </div>
            </div>
        </div>
    )
}
