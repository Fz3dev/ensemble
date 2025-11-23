"use client"

import { Member } from "@prisma/client"
import { User, PawPrint, Edit, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MEMBER_TYPE_LABELS, PET_TYPE_LABELS } from "@/lib/utils"
import { useState } from "react"
import { deleteMember } from "@/server/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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

interface MemberCardProps {
    member: Member & { user: { name: string | null; image: string | null } | null }
    onEdit?: (member: Member & { user: { name: string | null; image: string | null } | null }) => void
    isAdmin: boolean
    isCurrentUser?: boolean
}

export function MemberCard({ member, onEdit, isAdmin, isCurrentUser }: MemberCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()

    const displayName = member.nickname || member.user?.name || "Membre"
    const initials = displayName[0]?.toUpperCase() || "?"

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteMember(member.id)

        if (result.success) {
            toast.success("Membre supprimé")
            router.refresh()
        } else {
            toast.error(result.error || "Erreur lors de la suppression")
        }
        setIsDeleting(false)
        setShowDeleteDialog(false)
    }

    const canEdit = !member.userId || isCurrentUser // Allow editing own adult profile
    const isAdminMember = member.role === "ADMIN"

    return (
        <>
            <div className="relative bg-white rounded-2xl border-2 border-gray-100 p-4 transition-all hover:shadow-lg hover:border-primary/20">
                {/* Member Type Icon */}
                <div className="absolute -top-3 -right-3 p-2 rounded-full bg-white dark:bg-card border-2 border-gray-100 dark:border-border shadow-sm">
                    {member.type === "CHILD" && <User className="w-4 h-4 text-primary" />}
                    {member.type === "PET" && <PawPrint className="w-4 h-4 text-primary" />}
                    {member.type === "ADULT" && isAdminMember && <Shield className="w-4 h-4 text-primary" />}
                    {member.type === "ADULT" && !isAdminMember && <User className="w-4 h-4 text-primary" />}
                </div>

                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-4 border-white shadow-md"
                        style={{ backgroundColor: member.color }}
                    >
                        {member.user?.image ? (
                            <img
                                src={member.user.image}
                                alt={displayName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                        {MEMBER_TYPE_LABELS[member.type as keyof typeof MEMBER_TYPE_LABELS]}
                                    </span>
                                    {isAdminMember && (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                            <Shield className="w-3 h-3" />
                                            Admin
                                        </span>
                                    )}
                                    {member.type === "PET" && member.petType && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                            {PET_TYPE_LABELS[member.petType as keyof typeof PET_TYPE_LABELS]}
                                        </span>
                                    )}
                                    {member.type === "CHILD" && member.age && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                            {member.age} ans
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {(isAdmin || canEdit) && (
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={() => onEdit?.(member)}
                                    >
                                        <Edit className="w-4 w-4" />
                                    </Button>
                                    {/* Show delete only if not current user */}
                                    {!isCurrentUser && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setShowDeleteDialog(true)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{displayName}</strong> ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
