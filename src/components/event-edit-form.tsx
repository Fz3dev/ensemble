"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateEvent } from "@/server/actions"
import { CATEGORY_LABELS } from "@/lib/utils"
import { MemberSelector } from "@/components/member-selector"
import { useState } from "react"
import { toast } from "sonner"
import { TEXTS } from "@/lib/constants/texts"
import { format } from "date-fns"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EventEditFormProps {
    event: any
    members: any[]
    onCancel: () => void
    onSuccess: () => void
}

export function EventEditForm({ event, members, onCancel, onSuccess }: EventEditFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSeriesConfirm, setShowSeriesConfirm] = useState(false)
    const [formData, setFormData] = useState<FormData | null>(null)

    // Initial state from event
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
        event.participants?.map((p: any) => p.memberId) || []
    )

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)

        // Append participants
        selectedMemberIds.forEach(id => data.append("participantIds", id))

        if (event.seriesId) {
            setFormData(data)
            setShowSeriesConfirm(true)
        } else {
            await performUpdate(data, false)
        }
    }

    const performUpdate = async (data: FormData, updateSeries: boolean) => {
        setIsSubmitting(true)
        const res = await updateEvent(event.id, data, updateSeries)

        if (res?.success) {
            toast.success(TEXTS.event.updateSuccess || "Événement modifié !")
            onSuccess()
        } else {
            toast.error(res?.error || TEXTS.errors.generic)
            setIsSubmitting(false)
        }
        setShowSeriesConfirm(false)
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <div>
                    <label className="text-sm font-medium">{TEXTS.event.title}</label>
                    <Input name="title" defaultValue={event.title} required />
                </div>

                <div>
                    <label className="text-sm font-medium">{TEXTS.event.category}</label>
                    <Select name="category" defaultValue={event.category}>
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.startTime}</label>
                        <Input name="startTime" type="time" defaultValue={format(new Date(event.startTime), "HH:mm")} required />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.endTime}</label>
                        <Input name="endTime" type="time" defaultValue={format(new Date(event.endTime), "HH:mm")} required />
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

                <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                        {TEXTS.common.cancel}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? "Enregistrement..." : TEXTS.common.save}
                    </Button>
                </div>
            </form>

            <AlertDialog open={showSeriesConfirm} onOpenChange={setShowSeriesConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{TEXTS.common.confirm}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {TEXTS.event.seriesUpdateWarning || "Cet événement fait partie d'une série. Voulez-vous modifier uniquement cet événement ou toute la série ?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
                        <AlertDialogCancel>{TEXTS.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => formData && performUpdate(formData, false)}>
                            {TEXTS.event.updateSingle || "Modifier cet événement"}
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => formData && performUpdate(formData, true)} className="bg-primary">
                            {TEXTS.event.updateSeries || "Modifier toute la série"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
