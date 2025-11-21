import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TEXTS } from "@/lib/constants/texts"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FadeIn } from "@/components/animations"
import { TaskCard } from "@/components/task-card"
import { CreateTaskButton } from "@/components/create-task-button"
import { redirect } from "next/navigation"

export default async function TasksPage({ params }: { params: { householdId: string } }) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const tasks = await prisma.task.findMany({
        where: {
            householdId: params.householdId,
            status: { not: "ARCHIVED" }
        },
        include: {
            assignees: {
                include: {
                    member: {
                        include: { user: true }
                    }
                }
            }
        },
        orderBy: [
            { status: 'asc' }, // TODO first
            { dueDate: 'asc' }, // Earliest due first
            { createdAt: 'desc' }
        ]
    })

    const members = await prisma.member.findMany({
        where: { householdId: params.householdId },
        include: { user: true }
    })

    const todoTasks = tasks.filter((t: any) => t.status === "TODO")
    const doneTasks = tasks.filter((t: any) => t.status === "DONE")

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{TEXTS.dashboard.tasks}</h2>
                <CreateTaskButton householdId={params.householdId} members={members} />
            </div>

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
                                    <TaskCard task={task} />
                                </FadeIn>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed">
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
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
