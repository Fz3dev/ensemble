"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TEXTS } from "@/lib/constants/texts"

interface Member {
    id: string
    userId: string
    user: {
        name: string | null
        image: string | null
    }
    color: string
}

interface MemberSelectorProps {
    members: Member[]
    selectedMemberIds: string[]
    onSelect: (ids: string[]) => void
}

export function MemberSelector({ members, selectedMemberIds, onSelect }: MemberSelectorProps) {
    const toggleMember = (memberId: string) => {
        if (selectedMemberIds.includes(memberId)) {
            onSelect(selectedMemberIds.filter((id) => id !== memberId))
        } else {
            onSelect([...selectedMemberIds, memberId])
        }
    }

    return (
        <div className="flex flex-wrap gap-3">
            {members.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id)
                // Get display name - use nickname or user name or just "Member"
                const displayName = member.nickname || member.user?.name || "Membre"
                const initials = displayName[0] || "?"

                return (
                    <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={cn(
                            "relative flex flex-col items-center gap-1 transition-all",
                            isSelected ? "opacity-100 scale-105" : "opacity-60 hover:opacity-80"
                        )}
                    >
                        <div className={cn(
                            "relative h-10 w-10 rounded-full border-2 transition-all",
                            isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"
                        )}>
                            <Avatar className="h-full w-full">
                                <AvatarImage src={member.user?.image || undefined} />
                                <AvatarFallback style={{ backgroundColor: member.color }} className="text-white text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {isSelected && (
                                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium max-w-[4rem] truncate">
                            {displayName.split(" ")[0]}
                        </span>
                    </button>
                )
            })}
            {members.length === 0 && (
                <p className="text-sm text-muted-foreground italic">{TEXTS.dashboard.noMembers}</p>
            )}
        </div>
    )
}
