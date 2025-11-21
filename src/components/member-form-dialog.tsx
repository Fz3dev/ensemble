"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addMember, updateMember } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PET_TYPE_LABELS, MEMBER_COLORS } from "@/lib/utils"
import { Member } from "@prisma/client"

interface MemberFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    householdId: string
    member?: Member // If editing
    memberType: "CHILD" | "PET" | "ADULT"
    userName?: string | null // For adults: fallback if no nickname
}

export function MemberFormDialog({ open, onOpenChange, householdId, member, memberType, userName }: MemberFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [name, setName] = useState("")
    const [age, setAge] = useState("")
    const [petType, setPetType] = useState("DOG")
    const [color, setColor] = useState("#7EB5E8")
    const router = useRouter()

    // Pre-fill form when editing
    useEffect(() => {
        if (member) {
            // For adults without nickname, use their account name
            const displayName = member.nickname || (memberType === "ADULT" ? userName || "" : "")
            setName(displayName)
            setAge(member.age?.toString() || "")
            setPetType(member.petType || "DOG")
            setColor(member.color || "#7EB5E8")
        } else {
            // Reset when adding new
            setName("")
            setAge("")
            setPetType("DOG")
            setColor("#7EB5E8")
        }
    }, [member, open, memberType, userName])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append("type", memberType)
        formData.append("name", name)
        if (memberType === "CHILD" && age) formData.append("age", age)
        if (memberType === "PET") formData.append("petType", petType)
        formData.append("color", color)

        let result
        if (member) {
            // Edit mode
            result = await updateMember(member.id, formData)
        } else {
            // Add mode
            result = await addMember(householdId, formData)
        }

        if (result.success) {
            toast.success(member ? "Membre modifié !" : "Membre ajouté !")
            router.refresh()
            onOpenChange(false)
            // Reset form
            setName("")
            setAge("")
            setPetType("DOG")
            setColor("#7EB5E8")
        } else {
            toast.error(result.error || "Erreur")
        }

        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {member ? "Modifier" : "Ajouter"} {memberType === "ADULT" ? "mon profil" : memberType === "CHILD" ? "un enfant" : "un animal"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">
                            {memberType === "ADULT" ? "Nom" : memberType === "CHILD" ? "Prénom" : "Nom de l'animal"}
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={memberType === "ADULT" ? "ex: Fawsy" : memberType === "CHILD" ? "ex: Emma" : "ex: Minou"}
                            required={memberType !== "ADULT"}
                        />
                        {memberType === "ADULT" && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Laisse vide pour utiliser ton nom de compte
                            </p>
                        )}
                    </div>

                    {memberType === "CHILD" && (
                        <div>
                            <Label htmlFor="age">Âge (optionnel)</Label>
                            <Input
                                id="age"
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="ex: 8"
                                min="0"
                                max="120"
                            />
                        </div>
                    )}

                    {memberType === "PET" && (
                        <div>
                            <Label htmlFor="petType">Type d'animal</Label>
                            <Select value={petType} onValueChange={setPetType}>
                                <SelectTrigger id="petType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label>Couleur</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {MEMBER_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`h-12 rounded-lg border-2 transition-all ${color === c.value
                                        ? "border-primary ring-2 ring-primary ring-offset-2 scale-105 dark:ring-offset-background"
                                        : "border-gray-200 hover:border-primary/50 dark:border-border"
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !name.trim()}>
                            {isSubmitting ? "Enregistrement..." : member ? "Modifier" : "Ajouter"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
