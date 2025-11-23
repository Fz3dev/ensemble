"use client"

import { TaskCard } from "@/components/task-card"
import { TaskDetailsDrawer } from "@/components/task-details-drawer"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TEXTS } from "@/lib/constants/texts"

interface DashboardTaskListProps {
    tasks: any[]
    members: any[]
}

export function DashboardTaskList({ tasks, members }: DashboardTaskListProps) {
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
        setIsDrawerOpen(true)
    }

    if (tasks.length === 0) {
        return (
            <Card className="border-dashed shadow-none bg-gray-50/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>{TEXTS.dashboard.noTasks}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {tasks.map((task: any) => (
                    <div key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
                        <TaskCard task={task} />
                    </div>
                ))}
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
