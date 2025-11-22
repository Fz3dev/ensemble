"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinHousehold } from "@/server/actions"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FadeIn } from "@/components/animations"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default function JoinHouseholdPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const data = new FormData(e.currentTarget)

        const res = await joinHousehold(data)

        if (res?.success) {
            if (res.pending) {
                setIsPending(true)
            }
        } else {
            toast.error(res?.error || "Code invalide")
            setIsSubmitting(false)
        }
    }

    if (isPending) {
        return (
            <div className="h-screen flex flex-col items-center pt-12 bg-background p-6 overflow-hidden">
                <FadeIn className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 mx-auto">
                            <Users className="w-10 h-10 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold mb-4">Demande envoyée !</h1>

                        <p className="text-gray-600 mb-8">
                            Votre demande a bien été transmise à l'administrateur de la famille.
                            Vous pourrez accéder à l'espace famille une fois votre demande approuvée.
                        </p>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Retour à la connexion
                        </Button>
                    </div>
                </FadeIn>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col items-center pt-12 bg-background p-6 overflow-hidden">
            <FadeIn className="w-full max-w-md">
                <Link
                    href="/onboarding/choice"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </Link>

                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 mx-auto">
                        <Users className="w-8 h-8 text-primary" />
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-2">
                        Rejoindre une famille
                    </h1>
                    <p className="text-gray-600 text-center mb-8">
                        Entrez le code d'invitation que vous avez reçu
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium block mb-2">
                                Code d'invitation
                            </label>
                            <Input
                                name="inviteCode"
                                placeholder="Ex: AbC123xYz"
                                required
                                className="text-center text-lg tracking-wider font-mono"
                                maxLength={20}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Le code est sensible à la casse
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Vérification..." : "Rejoindre"}
                        </Button>
                    </form>
                </div>
            </FadeIn>
        </div>
    )
}
