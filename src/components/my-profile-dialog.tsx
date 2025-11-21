"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMember } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MyProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    memberId: string
    currentNickname: string | null
    currentColor: string
}

const COLORS = [
    { value: "#7EB5E8", label: "Bleu Ciel" },
    { value: "#7DD4A8", label: "Vert Menthe" },
    { value: "#F5D06C", label: "Jaune Soleil" },
    { value: "#F09A8F", label: "Corail" },
    { value: "#E89FCE", label: "Rose Bonbon" },
    { value: "#B5A4E8", label: "Lavande" },
    { value: "#78D4D0", label: "Turquoise" },
    { value: "#F5B98F", label: "Pêche" },
]

export function MyProfileDialog({ open, onOpenChange, memberId, currentNickname, currentColor }: MyProfileDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [nickname, setNickname] = useState(currentNickname || "")
    const [color, setColor] = useState(currentColor)
    const router = useRouter()

    useEffect(() => {
        setNickname(currentNickname || "")
        setColor(currentColor)
    }, [currentNickname, currentColor, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append("type", "ADULT")
        if (nickname.trim()) formData.append("name", nickname)
        formData.append("color", color)

        const result = await updateMember(memberId, formData)

        if (result.success) {
            toast.success("Profil mis à jour !")
            router.refresh()
            onOpenChange(false)
        } else {
            toast.error(result.error || "Erreur")
        }

        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mon profil dans cette famille</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="nickname">Surnom (optionnel)</Label>
                        <Input
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="ex: Papa, Maman..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Laisse vide pour utiliser ton nom de compte
                        </p>
                    </div>

                    <div>
                        <Label>Ma couleur</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`h-12 rounded-lg border-2 transition-all ${color === c.value
                                        ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 scale-105"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
