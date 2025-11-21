"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createTask } from "@/server/actions"
import { TASK_RECURRENCE_LABELS } from "@/lib/utils"
import { MemberSelector } from "@/components/member-selector"
import { useState } from "react"
import { toast } from "sonner"
import { TEXTS } from "@/lib/constants/texts"

interface TaskFormProps {
    householdId: string
    members: any[]
    onSuccess: () => void
}

export function TaskForm({ householdId, members, onSuccess }: TaskFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const data = new FormData(e.currentTarget)

        // Append participants
        selectedMemberIds.forEach(id => data.append("assigneeIds", id))

        console.log("Submitting Task Form Data:", Object.fromEntries(data.entries()))
        console.log("Assignee IDs:", selectedMemberIds)

        const res = await createTask(householdId, data)
        console.log("Server Response:", res)

        if (res?.success) {
            toast.success("Tâche créée !")
            onSuccess()
        } else {
            toast.error(res?.error || TEXTS.errors.generic)
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
                <label className="text-sm font-medium">Titre</label>
                <Input name="title" placeholder="Ex: Sortir les poubelles" required />
            </div>

            <div>
                <label className="text-sm font-medium">Description (optionnel)</label>
                <Textarea name="description" placeholder="Détails supplémentaires..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Date limite</label>
                    <Input name="dueDate" type="date" />
                </div>
                <div>
                    <label className="text-sm font-medium">Récurrence</label>
                    <Select name="recurrence" defaultValue="NONE">
                        <SelectTrigger>
                            <SelectValue placeholder="Récurrence" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(TASK_RECURRENCE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-2 block">Assigné à</label>
                <MemberSelector
                    members={members}
                    selectedMemberIds={selectedMemberIds}
                    onSelect={setSelectedMemberIds}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? TEXTS.common.loading : "Créer la tâche"}
            </Button>
        </form>
    )
}
