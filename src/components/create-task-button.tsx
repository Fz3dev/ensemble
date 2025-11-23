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
import { TaskForm } from "@/components/task-form"

interface CreateTaskButtonProps {
    householdId: string
    members: any[]
    children?: React.ReactNode
}

export function CreateTaskButton({ householdId, members, children }: CreateTaskButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle tâche
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="max-h-[75vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle>Nouvelle tâche</DrawerTitle>
                        <DrawerDescription>Créez une nouvelle tâche pour la famille.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-8">
                        <TaskForm
                            householdId={householdId}
                            members={members}
                            onSuccess={() => setOpen(false)}
                        />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
