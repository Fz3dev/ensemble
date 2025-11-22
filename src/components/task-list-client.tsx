"use client"

import { FadeIn } from "@/components/animations"
import { TaskCard } from "@/components/task-card"
import { TaskDetailsDrawer } from "@/components/task-details-drawer"
import { SwipeableEventCard } from "@/components/swipeable-event-card"
import { deleteTask } from "@/server/actions"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { toast } from "sonner"

interface TaskListClientProps {
    tasks: any[]
    members: any[]
}

export function TaskListClient({ tasks, members }: TaskListClientProps) {
    const router = useRouter()
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set())
    const pendingDeletes = useRef<Record<string, NodeJS.Timeout>>({})

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
        setIsDrawerOpen(true)
    }

    const handleDelete = (taskId: string) => {
        // Optimistically hide the task
        setDeletedTaskIds(prev => {
            const newSet = new Set(prev)
            newSet.add(taskId)
            return newSet
        })

        // Schedule actual deletion
        const timeoutId = setTimeout(async () => {
            await deleteTask(taskId)
            router.refresh()
            delete pendingDeletes.current[taskId]
        }, 4000)

        pendingDeletes.current[taskId] = timeoutId

        // Show Toast with Undo
        toast("Tâche supprimée", {
            action: {
                label: "Annuler",
                onClick: () => handleUndo(taskId)
            },
            duration: 3500,
        })
    }

    const handleUndo = (taskId: string) => {
        // Clear timeout
        const timeoutId = pendingDeletes.current[taskId]
        if (timeoutId) {
            clearTimeout(timeoutId)
            delete pendingDeletes.current[taskId]
        }

        // Restore UI
        setDeletedTaskIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(taskId)
            return newSet
        })
    }

    const todoTasks = tasks.filter((t: any) => t.status === "TODO" && !deletedTaskIds.has(t.id))
    const doneTasks = tasks.filter((t: any) => t.status === "DONE" && !deletedTaskIds.has(t.id))

    return (
        <>
            <div className="space-y-6">
                {/* TODO Section */}
                <section className="space-y-3">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                        À faire ({todoTasks.length})
                    </h2>
                    {todoTasks.length > 0 ? (
                        <div className="space-y-3">
                            {todoTasks.map((task: any, i: number) => (
                                <FadeIn key={task.id} delay={i * 0.05}>
                                    <SwipeableEventCard onDelete={() => handleDelete(task.id)}>
                                        <div onClick={() => handleTaskClick(task)}>
                                            <TaskCard task={task} />
                                        </div>
                                    </SwipeableEventCard>
                                </FadeIn>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-muted/20 rounded-2xl border-2 border-dashed">
                            <p className="text-muted-foreground">Rien à faire ! Profitez-en 🎉</p>
                        </div>
                    )}
                </section>

                {/* DONE Section */}
                {doneTasks.length > 0 && (
                    <section className="space-y-3 opacity-80">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                            Terminé récemment
                        </h2>
                        <div className="space-y-3">
                            {doneTasks.map((task: any) => (
                                <SwipeableEventCard key={task.id} onDelete={() => handleDelete(task.id)}>
                                    <div onClick={() => handleTaskClick(task)}>
                                        <TaskCard task={task} />
                                    </div>
                                </SwipeableEventCard>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <TaskDetailsDrawer
                task={selectedTask}
                members={members}
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false)
                    setSelectedTask(null)
                }}
            />
        </>
    )
}
