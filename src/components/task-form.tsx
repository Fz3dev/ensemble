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
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)

    const commonEmojis = ["🧹", "🍽️", "🧺", "🐶", "🐱", "🌱", "🚗", "🛒", "📚", "🎮"]

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const data = new FormData(e.currentTarget)

        // Append participants
        selectedMemberIds.forEach(id => data.append("assigneeIds", id))

        // Append emoji if selected
        if (selectedEmoji) {
            data.append("emoji", selectedEmoji)
        }

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

            <div>
                <label className="text-sm font-medium mb-2 block">Emoji (optionnel)</label>
                <div className="flex flex-wrap gap-2">
                    {commonEmojis.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                            className={`text-2xl p-2 rounded-lg border-2 transition-all ${selectedEmoji === emoji
                                ? 'border-primary bg-primary/10 scale-110'
                                : 'border-gray-200 hover:border-primary/50 dark:border-muted'
                                }`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-xs">
                <label className="text-sm font-medium">Date limite (optionnel)</label>
                <Input name="dueDate" type="date" />
            </div>

            <div>
                <label className="text-sm font-medium mb-1 block">Visibilité</label>
                <Select name="visibility" defaultValue="HOUSEHOLD">
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la visibilité" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="HOUSEHOLD">Toute la famille</SelectItem>
                        <SelectItem value="PARTICIPANTS">Participants uniquement</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                    "Participants uniquement" rendra la tâche visible seulement aux personnes assignées.
                </p>
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
