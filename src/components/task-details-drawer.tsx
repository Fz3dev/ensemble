"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, Calendar as CalendarIcon, Trash2, Pencil, Repeat } from "lucide-react"
import { deleteTask } from "@/server/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TEXTS } from "@/lib/constants/texts"
import { TaskEditForm } from "@/components/task-edit-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TASK_RECURRENCE_LABELS } from "@/lib/utils"

interface TaskDetailsDrawerProps {
    task: any | null
    members: any[]
    isOpen: boolean
    onClose: () => void
}

export function TaskDetailsDrawer({ task, members, isOpen, onClose }: TaskDetailsDrawerProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    if (!task) return null

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteTask(task.id)
        setIsDeleting(false)

        if (result.success) {
            toast.success("Tâche supprimée")
            onClose()
            router.refresh()
        } else {
            toast.error(TEXTS.errors.generic)
        }
    }

    const handleEditSuccess = () => {
        setIsEditing(false)
        onClose()
        router.refresh()
    }

    // Get assignee details
    const assignees = task.assignees?.map((a: any) =>
        members.find(m => m.id === a.memberId)
    ).filter(Boolean) || []

    return (
        <Drawer open={isOpen} onOpenChange={(open) => {
            if (!open) setIsEditing(false)
            onClose()
        }}>
            <DrawerContent className="max-h-[75vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    {isEditing ? (
                        <>
                            <DrawerHeader>
                                <DrawerTitle>Modifier la tâche</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 pb-8">
                                <TaskEditForm
                                    task={task}
                                    members={members}
                                    onSuccess={handleEditSuccess}
                                    onCancel={() => setIsEditing(false)}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <DrawerHeader>
                                <div className="flex items-start gap-3">
                                    {task.emoji && (
                                        <span className="text-3xl">{task.emoji}</span>
                                    )}
                                    <div className="flex-1">
                                        <DrawerTitle className="text-left">{task.title}</DrawerTitle>
                                        {task.description && (
                                            <DrawerDescription className="text-left mt-2">
                                                {task.description}
                                            </DrawerDescription>
                                        )}
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="px-4 space-y-4">
                                {/* Due Date */}
                                {task.dueDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className={
                                            new Date(task.dueDate) < new Date() && task.status !== "DONE"
                                                ? "text-red-500 font-medium"
                                                : ""
                                        }>
                                            {format(new Date(task.dueDate), "EEEE d MMMM yyyy", { locale: fr })}
                                        </span>
                                    </div>
                                )}

                                {/* Assignees */}
                                {assignees.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Assigné à</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignees.map((member: any) => (
                                                <div key={member.id} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                                                    <Avatar className="h-5 w-5" style={{ backgroundColor: member.color }}>
                                                        <AvatarFallback className="text-white text-xs font-semibold">
                                                            {(member.nickname || member.user?.name)?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{member.nickname || member.user?.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "DONE"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        }`}>
                                        {task.status === "DONE" ? "Terminée" : "À faire"}
                                    </span>
                                </div>
                            </div>

                            <DrawerFooter className="flex-col gap-2">
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Modifier
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Supprimer
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible. La tâche sera définitivement supprimée.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {isDeleting ? "Suppression..." : "Supprimer"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full">Fermer</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
