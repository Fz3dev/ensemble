"use client"

import { Member } from "@prisma/client"
import { MemberCard } from "@/components/member-card"
import { MemberDetailsDrawer } from "@/components/member-details-drawer"
import { Button } from "@/components/ui/button"
import { Plus, Users, User, PawPrint, Edit } from "lucide-react"
import { useState } from "react"
import { FadeIn } from "@/components/animations"

interface MembersClientProps {
    householdId: string
    members: (Member & { user: { name: string | null; image: string | null } | null })[]
    currentUserId: string
    isAdmin: boolean
}

export function MembersClient({ householdId, members, currentUserId, isAdmin }: MembersClientProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogType, setDialogType] = useState<"CHILD" | "PET" | "ADULT">("CHILD")
    const [editingMember, setEditingMember] = useState<(Member & { user: { name: string | null; image: string | null } | null }) | undefined>()

    const currentUserMember = members.find((m) => m.userId === currentUserId)
    const adults = members.filter((m) => m.type === "ADULT")
    const children = members.filter((m) => m.type === "CHILD")
    const pets = members.filter((m) => m.type === "PET")

    const handleAddMember = (type: "CHILD" | "PET" | "ADULT") => {
        setDialogType(type)
        setEditingMember(undefined)
        setDialogOpen(true)
    }

    const handleEditMember = (member: Member & { user: { name: string | null; image: string | null } | null }) => {
        setDialogType(member.type as "CHILD" | "PET" | "ADULT")
        setEditingMember(member)
        setDialogOpen(true)
    }

    return (
        <>
            <div className="space-y-8 py-6">
                {/* Header */}
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold font-serif text-primary">Membres</h1>
                            <p className="text-sm text-muted-foreground">
                                {members.length} membre{members.length > 1 ? "s" : ""} au total
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* Adults Section */}
                {adults.length > 0 && (
                    <FadeIn delay={0.1}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Adultes</h2>
                                    <span className="text-sm text-muted-foreground">({adults.length})</span>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {adults.map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        isAdmin={isAdmin}
                                        isCurrentUser={member.userId === currentUserId}
                                        onEdit={member.userId === currentUserId ? handleEditMember : undefined}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground italic px-2">
                                💡 Les adultes sont gérés via le système d'invitations
                            </p>
                        </div>
                    </FadeIn>
                )}

                {/* Children Section */}
                <FadeIn delay={0.2}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">Enfants</h2>
                                <span className="text-sm text-muted-foreground">({children.length})</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAddMember("CHILD")}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                            </Button>
                        </div>

                        {children.length > 0 ? (
                            <div className="grid gap-3">
                                {children.map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        onEdit={handleEditMember}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 dark:bg-muted/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-border">
                                <User className="w-12 h-12 mx-auto text-gray-300 dark:text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-gray-500 dark:text-muted-foreground">Aucun enfant ajouté</p>
                                <Button
                                    variant="link"
                                    onClick={() => handleAddMember("CHILD")}
                                    className="mt-2"
                                >
                                    Ajouter le premier enfant
                                </Button>
                            </div>
                        )}
                    </div>
                </FadeIn>

                {/* Pets Section */}
                <FadeIn delay={0.3}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PawPrint className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">Animaux</h2>
                                <span className="text-sm text-muted-foreground">({pets.length})</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAddMember("PET")}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                            </Button>
                        </div>

                        {pets.length > 0 ? (
                            <div className="grid gap-3">
                                {pets.map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        onEdit={handleEditMember}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 dark:bg-muted/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-border">
                                <PawPrint className="w-12 h-12 mx-auto text-gray-300 dark:text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-gray-500 dark:text-muted-foreground">Aucun animal ajouté</p>
                                <Button
                                    variant="link"
                                    onClick={() => handleAddMember("PET")}
                                    className="mt-2"
                                >
                                    Ajouter le premier animal
                                </Button>
                            </div>
                        )}
                    </div>
                </FadeIn>
            </div>

            {/* Add/Edit Drawer */}
            <MemberDetailsDrawer
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                householdId={householdId}
                member={editingMember}
                memberType={dialogType}
                userName={editingMember?.user?.name}
            />
        </>
    )
}
