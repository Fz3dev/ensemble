"use client"

import * as React from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"

interface MemberFilterProps {
    members: any[]
}

export function MemberFilter({ members }: MemberFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = React.useState(false)
    const selectedMemberIds = searchParams.get("members")?.split(",").filter(Boolean) || []

    const handleToggle = (memberId: string) => {
        const newSelectedIds = selectedMemberIds.includes(memberId)
            ? selectedMemberIds.filter((id) => id !== memberId)
            : [...selectedMemberIds, memberId]

        const params = new URLSearchParams(searchParams.toString())
        if (newSelectedIds.length > 0) {
            params.set("members", newSelectedIds.join(","))
        } else {
            params.delete("members")
        }
        router.push(`?${params.toString()}`)
    }

    const handleClear = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("members")
        router.push(`?${params.toString()}`)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtres
                    {selectedMemberIds.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-2 rounded-sm px-1 font-normal"
                        >
                            {selectedMemberIds.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-3" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Membres</h4>
                        {selectedMemberIds.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={handleClear}
                            >
                                Effacer
                            </Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {members.map((member) => {
                            const isSelected = selectedMemberIds.includes(member.id)
                            return (
                                <div key={member.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`member-${member.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggle(member.id)}
                                    />
                                    <Label
                                        htmlFor={`member-${member.id}`}
                                        className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: member.color }}
                                        />
                                        <span>{member.nickname || member.user?.name}</span>
                                    </Label>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
