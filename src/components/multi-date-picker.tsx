"use client"

import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function MultiDatePicker({ name, initialDates = [] }: { name: string, initialDates?: Date[] }) {
    // Ensure initialDates are valid Date objects
    const validInitialDates = initialDates.length > 0
        ? initialDates
            .map(d => d instanceof Date ? d : new Date(d))
            .filter(d => !isNaN(d.getTime()))
        : undefined

    const [dates, setDates] = useState<Date[] | undefined>(validInitialDates)

    return (
        <div className="space-y-2">
            <input type="hidden" name={name} value={JSON.stringify(dates?.map(d => format(d, 'yyyy-MM-dd')) || [])} />

            <div className="flex justify-center">
                <Calendar
                    mode="multiple"
                    locale={fr}
                    selected={dates}
                    onSelect={setDates}
                    className="rounded-md border shadow-sm bg-card"
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                />
            </div>

            <div className="text-sm text-muted-foreground min-h-[20px]">
                {dates && dates.length > 0 ? (
                    <p>Sélection : {dates.length} date(s)</p>
                ) : (
                    <p>Sélectionnez une ou plusieurs dates</p>
                )}
            </div>
        </div>
    )
}
