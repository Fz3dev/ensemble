"use client"

import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createEvent } from "@/server/actions"
import { CATEGORY_LABELS } from "@/lib/utils"
import { MultiDatePicker } from "@/components/multi-date-picker"
import { MemberSelector } from "@/components/member-selector"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { TEXTS } from "@/lib/constants/texts"

interface EventFormProps {
    householdId: string
    members: any[]
    initialData?: any
}

export function EventForm({ householdId, members, initialData }: EventFormProps) {
    const router = useRouter()
    // Pre-select members if initialData is provided
    const initialMemberIds = initialData?.participants?.map((p: any) => p.memberId) || []

    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialMemberIds)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)

        // Append selected members manually since they are not standard inputs
        selectedMemberIds.forEach(id => formData.append("participantIds", id))

        const res = await createEvent(householdId, formData)

        if (res?.success) {
            toast.success(TEXTS.event.createSuccess || "Événement créé !")
            router.push(`/household/${householdId}/calendar`)
            router.refresh()
        } else {
            toast.error(res?.error || TEXTS.errors.generic)
            setIsSubmitting(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">{TEXTS.event.title}</label>
                    <Input
                        name="title"
                        placeholder="Ex: Rendez-vous pédiatre"
                        defaultValue={initialData?.title || ""}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">{TEXTS.event.date}</label>
                        <MultiDatePicker name="dates" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.category}</label>
                        <Select name="category" defaultValue={initialData?.category || "OTHER"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.startTime}</label>
                        <Input
                            name="startTime"
                            type="time"
                            defaultValue={initialData ? format(new Date(initialData.startTime), "HH:mm") : ""}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.endTime}</label>
                        <Input
                            name="endTime"
                            type="time"
                            defaultValue={initialData ? format(new Date(initialData.endTime), "HH:mm") : ""}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">{TEXTS.dashboard.members}</label>
                    <MemberSelector
                        members={members}
                        selectedMemberIds={selectedMemberIds}
                        onSelect={setSelectedMemberIds}
                    />
                </div>
            </div>

            <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : TEXTS.calendar.addEvent}
            </Button>
        </form>
    )
}
