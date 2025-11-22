"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Copy, Share2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { copyToClipboard } from "@/lib/utils"

interface InviteCodeDisplayProps {
    inviteCode: string
    householdName: string
}

export function InviteCodeDisplay({ inviteCode, householdName }: InviteCodeDisplayProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        const success = await copyToClipboard(inviteCode)
        if (success) {
            setCopied(true)
            toast.success("Code copié !")
            setTimeout(() => setCopied(false), 2000)
        } else {
            toast.error("Impossible de copier automatiquement")
        }
    }

    const shareInvite = async () => {
        const text = `Rejoins ma famille "${householdName}" sur Ensemble !\nCode d'invitation : ${inviteCode}`

        if (navigator.share) {
            try {
                await navigator.share({ text })
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback to copy
            const success = await copyToClipboard(text)
            if (success) {
                toast.success("Message copié !")
            } else {
                toast.error("Impossible de copier le message")
            }
        }
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">
                            Code d'invitation
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-border rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-wider">
                                {inviteCode}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                className="h-12 w-12"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                            Partagez ce code avec les personnes que vous souhaitez inviter
                        </p>
                    </div>

                    <Button
                        onClick={shareInvite}
                        variant="outline"
                        className="w-full"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager l'invitation
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
