"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerDescription,
} from "@/components/ui/drawer"
import { EventForm } from "@/components/event-form"
import { TEXTS } from "@/lib/constants/texts"

interface CreateEventButtonProps {
    householdId: string
    members: any[]
    initialData?: any
    children?: React.ReactNode
}

export function CreateEventButton({ householdId, members, initialData, children }: CreateEventButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {TEXTS.calendar.addEvent}
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="max-h-[75vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle>{TEXTS.calendar.addEvent}</DrawerTitle>
                        <DrawerDescription>Créez un nouvel événement pour la famille.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-8">
                        <EventForm
                            householdId={householdId}
                            members={members}
                            initialData={initialData}
                            onSuccess={() => setOpen(false)}
                        />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
