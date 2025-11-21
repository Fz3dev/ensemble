"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { toggleTask } from "@/server/actions"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface TaskCardProps {
    task: any
}

export function TaskCard({ task }: TaskCardProps) {
    const [isCompleted, setIsCompleted] = useState(task.status === "DONE")
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async () => {
        if (isLoading) return
        setIsLoading(true)

        // Optimistic update
        const newState = !isCompleted
        setIsCompleted(newState)

        const res = await toggleTask(task.id, task.status)

        if (!res?.success) {
            // Revert on failure
            setIsCompleted(!newState)
            toast.error("Erreur lors de la mise à jour")
        } else if (newState) {
            toast.success("Tâche terminée !")
        }

        setIsLoading(false)
    }

    return (
        <Card className={cn(
            "transition-all duration-300 border-l-4",
            isCompleted ? "bg-gray-50 border-l-gray-300 opacity-60 dark:bg-muted/20 dark:border-l-muted" : "bg-white border-l-primary hover:shadow-md dark:bg-card"
        )}>
            <CardContent className="p-4 flex items-center gap-4">
                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={cn(
                        "flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        isCompleted ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-primary dark:border-muted"
                    )}
                >
                    {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                </button>

                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "font-medium truncate transition-all",
                        isCompleted ? "text-muted-foreground line-through" : "text-gray-900 dark:text-foreground"
                    )}>
                        {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {task.recurrence !== "NONE" && (
                            <span className="flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                <Repeat className="w-3 h-3" />
                                {task.recurrence === "DAILY" ? "Tous les jours" : task.recurrence === "WEEKLY" ? "Hebdo" : "Mensuel"}
                            </span>
                        )}
                        {task.dueDate && (
                            <span className={cn(
                                new Date(task.dueDate) < new Date() && !isCompleted ? "text-red-500 font-medium" : ""
                            )}>
                                {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Assignees */}
                    {task.assignees?.length > 0 && (
                        <div className="flex -space-x-2">
                            {task.assignees.map((a: any) => (
                                <Avatar key={a.member.id} className="h-6 w-6 border-2 border-white">
                                    <AvatarImage src={a.member.user.image} />
                                    <AvatarFallback style={{ backgroundColor: a.member.color }} className="text-[10px] text-white">
                                        {a.member.user.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
