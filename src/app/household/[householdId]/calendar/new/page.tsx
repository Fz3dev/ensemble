import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/event-form"
import { TEXTS } from "@/lib/constants/texts"

export default async function NewEventPage({
    params,
    searchParams
}: {
    params: { householdId: string }
    searchParams: { sourceEventId?: string }
}) {
    const members = await prisma.member.findMany({
        where: { householdId: params.householdId },
        include: { user: true }
    })

    let initialData = null
    if (searchParams.sourceEventId) {
        initialData = await prisma.event.findUnique({
            where: { id: searchParams.sourceEventId },
            include: {
                participants: true
            }
        })
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">{TEXTS.calendar.addEvent}</h2>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <EventForm
                    householdId={params.householdId}
                    members={members}
                    initialData={initialData}
                />
            </div>
        </div>
    )
}
