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
}

export function CreateTaskButton({ householdId, members }: CreateTaskButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button size="icon" className="rounded-full h-10 w-10 shadow-lg bg-primary hover:bg-primary/90">
                    <Plus className="h-5 w-5" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
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
