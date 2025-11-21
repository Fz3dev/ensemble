"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createHousehold, addMember } from "@/server/actions"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FadeIn, SlideIn } from "@/components/animations"
import { ArrowLeft, Home, Plus, X, User, PawPrint, Users, Copy, Check, Share2 } from "lucide-react"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PET_TYPE_LABELS } from "@/lib/utils"

interface TempMember {
    id: string
    type: "CHILD" | "PET"
    name: string
    age?: number
    petType?: string
}

export default function CreateFamilyPage() {
    const [step, setStep] = useState(1)
    const [householdName, setHouseholdName] = useState("")
    const [householdId, setHouseholdId] = useState<string>("")
    const [inviteCode, setInviteCode] = useState<string>("")
    const [members, setMembers] = useState<TempMember[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

    // New member form state
    const [newMemberType, setNewMemberType] = useState<"CHILD" | "PET">("CHILD")
    const [newMemberName, setNewMemberName] = useState("")
    const [newMemberAge, setNewMemberAge] = useState("")
    const [newMemberPetType, setNewMemberPetType] = useState("DOG")

    const handleCreateHousehold = async () => {
        if (!householdName.trim()) {
            toast.error("Veuillez entrer un nom de famille")
            return
        }

        setIsSubmitting(true)

        const formData = new FormData()
        formData.append("name", householdName)

        const res = await createHousehold(formData)

        if (res?.success && res.householdId) {
            // Add members if any
            if (members.length > 0) {
                for (const member of members) {
                    const memberFormData = new FormData()
                    memberFormData.append("type", member.type)
                    memberFormData.append("name", member.name)
                    if (member.age) memberFormData.append("age", member.age.toString())
                    if (member.petType) memberFormData.append("petType", member.petType)

                    await addMember(res.householdId, memberFormData)
                }
            }

            // Store household info and move to step 3
            setHouseholdId(res.householdId)
            setInviteCode(res.inviteCode || "")
            setStep(3)
            setIsSubmitting(false)
        } else {
            toast.error(res?.error || "Erreur lors de la création")
            setIsSubmitting(false)
        }
    }

    const addTempMember = () => {
        if (!newMemberName.trim()) {
            toast.error("Veuillez entrer un nom")
            return
        }

        const tempMember: TempMember = {
            id: Date.now().toString(),
            type: newMemberType,
            name: newMemberName,
            age: newMemberType === "CHILD" && newMemberAge ? parseInt(newMemberAge) : undefined,
            petType: newMemberType === "PET" ? newMemberPetType : undefined,
        }

        setMembers([...members, tempMember])
        setNewMemberName("")
        setNewMemberAge("")
        toast.success(`${newMemberType === "CHILD" ? "Enfant" : "Animal"} ajouté !`)
    }

    const removeTempMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id))
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteCode)
            setCopied(true)
            toast.success("Code copié !")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Erreur lors de la copie")
        }
    }

    const shareInvite = async () => {
        const text = `Rejoins ma famille "${householdName}" sur Ensemble !\nCode d'invitation : ${inviteCode}`

        if (navigator.share) {
            try {
                await navigator.share({ text })
            } catch (err) {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(text)
            toast.success("Message copié !")
        }
    }

    const finishOnboarding = () => {
        toast.success("Famille créée avec succès !")
        router.push(`/household/${householdId}`)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
            <FadeIn className="w-full max-w-2xl">
                {step < 3 && (
                    <Link
                        href="/onboarding/choice"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </Link>
                )}

                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className={`w-3 h-3 rounded-full ${step === 1 ? "bg-primary" : "bg-muted"}`} />
                        <div className={`w-3 h-3 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
                        <div className={`w-3 h-3 rounded-full ${step === 3 ? "bg-primary" : "bg-muted"}`} />
                    </div>

                    {/* Step 1: Household name */}
                    {step === 1 && (
                        <SlideIn direction="left" className="space-y-6">
                            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 mx-auto">
                                <Home className="w-8 h-8 text-primary" />
                            </div>

                            <div className="text-center">
                                <h1 className="text-3xl font-bold mb-2">Créer votre famille</h1>
                                <p className="text-gray-600">
                                    Commençons par donner un nom à votre organisation
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Nom de la famille
                                </label>
                                <Input
                                    value={householdName}
                                    onChange={(e) => setHouseholdName(e.target.value)}
                                    placeholder="Ex: Famille Martin"
                                    className="text-lg h-12"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!householdName.trim()}
                                    className="flex-1 h-12 text-lg bg-primary hover:bg-primary/90"
                                >
                                    Continuer
                                </Button>
                            </div>
                        </SlideIn>
                    )}

                    {/* Step 2: Add members (optional) */}
                    {step === 2 && (
                        <SlideIn direction="right" className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2">Ajouter des membres</h2>
                                <p className="text-gray-600 text-sm">
                                    Enfants, animaux... (optionnel, vous pourrez le faire plus tard)
                                </p>
                            </div>

                            {/* Member type selector */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setNewMemberType("CHILD")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${newMemberType === "CHILD" ? "bg-white shadow-sm" : "text-gray-600"
                                        }`}
                                >
                                    <User className="w-4 h-4" />
                                    Enfant
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewMemberType("PET")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${newMemberType === "PET" ? "bg-white shadow-sm" : "text-gray-600"
                                        }`}
                                >
                                    <PawPrint className="w-4 h-4" />
                                    Animal
                                </button>
                            </div>

                            {/* Add member form */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                <Input
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    placeholder={newMemberType === "CHILD" ? "Prénom de l'enfant" : "Nom de l'animal"}
                                />

                                {newMemberType === "CHILD" && (
                                    <Input
                                        type="number"
                                        value={newMemberAge}
                                        onChange={(e) => setNewMemberAge(e.target.value)}
                                        placeholder="Âge (optionnel)"
                                        min="0"
                                        max="120"
                                    />
                                )}

                                {newMemberType === "PET" && (
                                    <Select value={newMemberPetType} onValueChange={setNewMemberPetType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <Button
                                    type="button"
                                    onClick={addTempMember}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter
                                </Button>
                            </div>

                            {/* Members list */}
                            {members.length > 0 && (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {member.type === "CHILD" ? (
                                                    <User className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <PawPrint className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{member.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {member.type === "CHILD" && member.age && `${member.age} ans`}
                                                    {member.type === "PET" && member.petType && PET_TYPE_LABELS[member.petType as keyof typeof PET_TYPE_LABELS]}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeTempMember(member.id)}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={() => setStep(1)}
                                    variant="outline"
                                    className="flex-1 h-12"
                                    disabled={isSubmitting}
                                >
                                    Retour
                                </Button>
                                <Button
                                    onClick={handleCreateHousehold}
                                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Création..." : (members.length > 0 ? "Continuer" : "Passer cette étape")}
                                </Button>
                            </div>
                        </SlideIn>
                    )}

                    {/* Step 3: Invite code */}
                    {step === 3 && (
                        <SlideIn direction="right" className="space-y-6">
                            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 mx-auto">
                                <Users className="w-8 h-8 text-primary" />
                            </div>

                            <div className="text-center">
                                <h2 className="text-3xl font-bold mb-2">Inviter des adultes</h2>
                                <p className="text-gray-600">
                                    Partagez ce code avec votre partenaire ou d'autres adultes
                                </p>
                            </div>

                            {/* Invite code display */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Code d'invitation
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-wider">
                                            {inviteCode}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={copyToClipboard}
                                            className="h-12 w-12 flex-shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Ils devront créer un compte puis utiliser ce code
                                    </p>
                                </div>

                                <Button
                                    onClick={shareInvite}
                                    variant="outline"
                                    className="w-full h-12"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Partager l'invitation
                                </Button>
                            </div>

                            {/* Info box */}
                            <div className="p-4 bg-muted/50 border border-muted rounded-xl">
                                <p className="text-sm text-muted-foreground">
                                    💡 <strong>Bon à savoir</strong> : Vous pourrez toujours retrouver et partager ce code dans les paramètres de votre famille.
                                </p>
                            </div>

                            {/* Finish button */}
                            <Button
                                onClick={finishOnboarding}
                                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                            >
                                Terminé ! Accéder au dashboard
                            </Button>


                        </SlideIn>
                    )}
                </div>
            </FadeIn>
        </div>
    )
}
