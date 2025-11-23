"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createEvent, updateEvent } from "@/server/actions"
import { CATEGORY_LABELS } from "@/lib/utils"
import { MultiDatePicker } from "@/components/multi-date-picker"
import { MemberSelector } from "@/components/member-selector"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { TEXTS } from "@/lib/constants/texts"
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

interface EventFormProps {
    mode?: "create" | "edit"
    householdId?: string
    eventId?: string
    event?: any
    members: any[]
    initialData?: any
    onSuccess?: () => void
    onCancel?: () => void
}

export function EventForm({
    mode = "create",
    householdId,
    eventId,
    event,
    members,
    initialData,
    onSuccess,
    onCancel
}: EventFormProps) {
    const router = useRouter()

    // Use event data for edit mode, initialData for create mode
    const data = mode === "edit" ? event : initialData

    // Pre-select members if data is provided
    const initialMemberIds = data?.participants?.map((p: any) => p.memberId) || []

    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialMemberIds)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check if event is all-day (00:00 - 23:59)
    // For edit mode: check event data
    // For create mode (duplication): check defaultStartTime if present
    const checkAllDay = (start: string | Date, end: string | Date) => {
        if (!start || !end) return false
        return format(new Date(start), "HH:mm") === "00:00" && format(new Date(end), "HH:mm") === "23:59"
    }

    const isEventAllDay = mode === "edit" && data
        ? checkAllDay(data.startTime, data.endTime)
        : data?.defaultStartTime
            ? checkAllDay(data.defaultStartTime, data.defaultEndTime)
            : false

    const [isAllDay, setIsAllDay] = useState(isEventAllDay)

    // For series confirmation in edit mode
    const [showSeriesConfirm, setShowSeriesConfirm] = useState(false)
    const [formData, setFormData] = useState<FormData | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formDataObj = new FormData(e.currentTarget)

        // Append selected members manually since they are not standard inputs
        selectedMemberIds.forEach(id => formDataObj.append("participantIds", id))

        // If all day, set default times
        if (isAllDay) {
            formDataObj.set("startTime", "00:00")
            formDataObj.set("endTime", "23:59")
        }

        if (mode === "create") {
            await submitCreate(formDataObj)
        } else {
            // Check if this is part of a series
            if (event?.seriesId) {
                setFormData(formDataObj)
                setShowSeriesConfirm(true)
                return
            }
            await submitUpdate(formDataObj, "single")
        }
    }

    const submitCreate = async (formDataObj: FormData) => {
        if (!householdId) return

        setIsSubmitting(true)
        const res = await createEvent(householdId, formDataObj)

        if (res?.success) {
            toast.success(TEXTS.event.createSuccess || "Événement créé !")
            if (onSuccess) {
                onSuccess()
                router.refresh()
            } else {
                router.push(`/household/${householdId}/calendar`)
                router.refresh()
            }
        } else {
            toast.error(res?.error || TEXTS.errors.generic)
            setIsSubmitting(false)
        }
    }

    const submitUpdate = async (formDataObj: FormData, updateType: "single" | "series") => {
        if (!eventId && !event?.id) return

        setIsSubmitting(true)
        formDataObj.set("updateType", updateType)

        const res = await updateEvent(eventId || event.id, formDataObj)

        if (res?.success) {
            toast.success("Événement modifié !")
            if (onSuccess) {
                onSuccess()
            }
        } else {
            toast.error(res?.error || TEXTS.errors.generic)
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className={mode === "edit" ? "space-y-4 p-1" : "space-y-6"}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{TEXTS.event.title}</label>
                        <Input
                            name="title"
                            placeholder={mode === "create" ? "Ex: Rendez-vous pédiatre" : undefined}
                            defaultValue={data?.title || ""}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Description (optionnel)</label>
                        <textarea
                            name="description"
                            placeholder="Ajoutez des détails sur l'événement..."
                            defaultValue={data?.description || ""}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                        />
                    </div>

                    {mode === "create" ? (
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">{TEXTS.event.date}</label>
                                <MultiDatePicker
                                    name="dates"
                                    initialDates={data && data.startTime ? [new Date(data.startTime)] : []}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{TEXTS.event.category}</label>
                                    <Select name="category" defaultValue={data?.category || "OTHER"}>
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
                                <div>
                                    <label className="text-sm font-medium">Visibilité</label>
                                    <Select name="visibility" defaultValue={data?.visibility || "HOUSEHOLD"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Visibilité" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOUSEHOLD">Toute la famille</SelectItem>
                                            <SelectItem value="PARTICIPANTS">Participants uniquement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-medium mb-2 block">{TEXTS.event.date}</label>
                                <MultiDatePicker
                                    name="date"
                                    initialDates={data && data.startTime ? [new Date(data.startTime)] : []}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{TEXTS.event.category}</label>
                                    <Select name="category" defaultValue={data?.category || "OTHER"}>
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
                                <div>
                                    <label className="text-sm font-medium">Visibilité</label>
                                    <Select name="visibility" defaultValue={data?.visibility || "HOUSEHOLD"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Visibilité" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOUSEHOLD">Toute la famille</SelectItem>
                                            <SelectItem value="PARTICIPANTS">Participants uniquement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* All day checkbox */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={mode === "edit" ? "allDayEdit" : "allDay"}
                            checked={isAllDay}
                            onCheckedChange={(checked) => setIsAllDay(checked === true)}
                        />
                        <label htmlFor={mode === "edit" ? "allDayEdit" : "allDay"} className="text-sm font-medium cursor-pointer select-none">
                            Toute la journée
                        </label>
                    </div>

                    {/* Time fields - only show if not all day */}
                    {!isAllDay && (
                        <div className="flex gap-12">
                            <div>
                                <label className="text-sm font-medium">{TEXTS.event.startTime}</label>
                                <Input
                                    name="startTime"
                                    type="time"
                                    className="h-10"
                                    defaultValue={
                                        data?.startTime
                                            ? format(new Date(data.startTime), "HH:mm")
                                            : data?.defaultStartTime
                                                ? format(new Date(data.defaultStartTime), "HH:mm")
                                                : ""
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">{TEXTS.event.endTime}</label>
                                <Input
                                    name="endTime"
                                    type="time"
                                    className="h-10"
                                    defaultValue={
                                        data?.endTime
                                            ? format(new Date(data.endTime), "HH:mm")
                                            : data?.defaultEndTime
                                                ? format(new Date(data.defaultEndTime), "HH:mm")
                                                : ""
                                    }
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium mb-2 block">{TEXTS.dashboard.members}</label>
                        <MemberSelector
                            members={members}
                            selectedMemberIds={selectedMemberIds}
                            onSelect={setSelectedMemberIds}
                        />
                    </div>
                </div>

                {mode === "create" ? (
                    <Button className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Création..." : "Créer l'événement"}
                    </Button>
                ) : (
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                            {TEXTS.common.cancel}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? "Enregistrement..." : TEXTS.common.save}
                        </Button>
                    </div>
                )}
            </form>

            {/* Series confirmation dialog - only for edit mode */}
            {mode === "edit" && (
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
                            <AlertDialogAction onClick={() => formData && submitUpdate(formData, "single")}>
                                {TEXTS.event.updateSingle || "Modifier cet événement"}
                            </AlertDialogAction>
                            <AlertDialogAction onClick={() => formData && submitUpdate(formData, "series")} className="bg-primary">
                                {TEXTS.event.updateSeries || "Modifier toute la série"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    )
}
