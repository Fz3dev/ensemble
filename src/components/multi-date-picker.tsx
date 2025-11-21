"use client"

import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function MultiDatePicker({ name }: { name: string }) {
    const [dates, setDates] = useState<Date[] | undefined>([])

    return (
        <div className="space-y-2">
            <input type="hidden" name={name} value={JSON.stringify(dates?.map(d => format(d, 'yyyy-MM-dd')) || [])} />

            <div className="rounded-md border bg-white p-2 flex justify-center">
                <Calendar
                    mode="multiple"
                    locale={fr}
                    selected={dates}
                    onSelect={setDates}
                    className="rounded-md border"
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
