"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addMember, updateMember } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PET_TYPE_LABELS, MEMBER_COLORS } from "@/lib/utils"
import { Member } from "@prisma/client"

interface MemberDetailsDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
    householdId: string
    member?: Member // If editing
    memberType: "CHILD" | "PET" | "ADULT"
    userName?: string | null // For adults: fallback if no nickname
    isAdmin?: boolean
    currentUserId?: string
}

export function MemberDetailsDrawer({ open, onOpenChange, householdId, member, memberType, userName }: MemberDetailsDrawerProps) {
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
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[85vh]">
                <div className="mx-auto w-full max-w-sm h-full flex flex-col">
                    <DrawerHeader>
                        <DrawerTitle className="text-center text-xl">
                            {member ? "Modifier" : "Ajouter"} {memberType === "ADULT" ? "mon profil" : memberType === "CHILD" ? "un enfant" : "un animal"}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <form id="member-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base">
                                    {memberType === "ADULT" ? "Nom" : memberType === "CHILD" ? "Prénom" : "Nom de l'animal"}
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={memberType === "ADULT" ? "ex: Fawsy" : memberType === "CHILD" ? "ex: Emma" : "ex: Minou"}
                                    required={memberType !== "ADULT"}
                                    className="h-12 text-lg"
                                />
                                {memberType === "ADULT" && (
                                    <p className="text-xs text-muted-foreground">
                                        Laisse vide pour utiliser ton nom de compte
                                    </p>
                                )}
                            </div>

                            {memberType === "CHILD" && (
                                <div className="space-y-2">
                                    <Label htmlFor="age" className="text-base">Âge (optionnel)</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="ex: 8"
                                        min="0"
                                        max="120"
                                        className="h-12 text-lg"
                                    />
                                </div>
                            )}

                            {memberType === "PET" && (
                                <div className="space-y-2">
                                    <Label htmlFor="petType" className="text-base">Type d'animal</Label>
                                    <Select value={petType} onValueChange={setPetType}>
                                        <SelectTrigger id="petType" className="h-12 text-lg">
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

                            <div className="space-y-2">
                                <Label className="text-base">Couleur</Label>
                                <div className="grid grid-cols-4 gap-3 mt-2">
                                    {MEMBER_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setColor(c.value)}
                                            className={`aspect-square rounded-xl border-2 transition-all ${color === c.value
                                                ? "border-primary ring-2 ring-primary ring-offset-2 scale-105"
                                                : "border-gray-200 hover:border-primary/50"
                                                }`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    <DrawerFooter className="pt-2 pb-8">
                        <Button
                            type="submit"
                            form="member-form"
                            className="h-12 text-lg w-full"
                            disabled={isSubmitting || (memberType !== "ADULT" && !name.trim())}
                        >
                            {isSubmitting ? "Enregistrement..." : member ? "Modifier" : "Ajouter"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="h-12 text-lg w-full">
                                Annuler
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
