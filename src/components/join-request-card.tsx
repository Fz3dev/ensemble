"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { approveJoinRequest, rejectJoinRequest } from "@/server/actions"
import { Check, X, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface JoinRequest {
    id: string
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
    }
}

import { useRouter } from "next/navigation"

interface JoinRequestCardProps {
    request: JoinRequest
}

export function JoinRequestCard({ request }: JoinRequestCardProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const router = useRouter()

    const handleApprove = async () => {
        setIsProcessing(true)
        const res = await approveJoinRequest(request.id)

        if (res?.success) {
            toast.success(`${request.user.name} a rejoint la famille !`)
            router.refresh()
        } else {
            toast.error(res?.error || "Erreur")
            setIsProcessing(false)
        }
    }

    const handleReject = async () => {
        setIsProcessing(true)
        const res = await rejectJoinRequest(request.id)

        if (res?.success) {
            toast.success("Demande refusée")
            router.refresh()
        } else {
            toast.error(res?.error || "Erreur")
            setIsProcessing(false)
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                            {request.user.name || "Utilisateur"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                            {request.user.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
