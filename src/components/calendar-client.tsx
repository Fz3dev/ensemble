"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function CalendarClient({ events }: { events: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParam = searchParams.get("date")
    const date = dateParam ? new Date(dateParam) : new Date()

    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    const handleSelect = (newDate: Date | undefined) => {
        setSelectedDate(newDate)
        if (newDate) {
            router.push(`?date=${format(newDate, "yyyy-MM-dd")}`)
        }
    }

    return (
        <div className="w-full flex justify-center">
            <Calendar
                mode="single"
                locale={fr}
                selected={selectedDate}
                onSelect={handleSelect}
                className="rounded-md w-full max-w-full"
                classNames={{
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full justify-between",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                    row: "flex w-full mt-2 justify-between",
                    cell: "h-auto w-full aspect-square text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-full w-full p-0 font-normal aria-selected:opacity-100 rounded-md flex flex-col items-center justify-start pt-1",
                }}
                components={{
                    DayContent: (props) => {
                        const { date } = props
                        const dayEvents = events.filter((event) => {
                            const eventDate = new Date(event.startTime)
                            return (
                                eventDate.getDate() === date.getDate() &&
                                eventDate.getMonth() === date.getMonth() &&
                                eventDate.getFullYear() === date.getFullYear()
                            )
                        })

                        // Extract unique colors from participants of these events
                        const colors = Array.from(new Set(dayEvents.flatMap(e =>
                            e.participants?.map((p: any) => p.member?.color) || []
                        ))).filter(Boolean) as string[]

                        return (
                            <div className="flex flex-col items-center justify-start h-full w-full relative pt-1">
                                <span className="text-sm font-medium">{date.getDate()}</span>
                                {colors.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 justify-center w-full px-1">
                                        {colors.map((color, i) => (
                                            <div
                                                key={i}
                                                className="h-1.5 w-1.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }
                }}
            />
        </div>
    )
}
