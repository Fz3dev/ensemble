import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TEXTS } from "@/lib/constants/texts"
import { MemberFilter } from "@/components/member-filter"
import { redirect } from "next/navigation"
import { TaskListClient } from "@/components/task-list-client"
import { CreateTaskButton } from "@/components/create-task-button"

export default async function TasksPage({
    params,
    searchParams
}: {
    params: { householdId: string }
    searchParams: { members?: string }
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const memberIds = searchParams.members?.split(",") || []

    // Build where clause for tasks
    const whereClause: any = {
        householdId: params.householdId,
        status: { not: "ARCHIVED" }
    }

    if (memberIds.length > 0) {
        whereClause.assignees = {
            some: {
                memberId: {
                    in: memberIds
                }
            }
        }
    }

    // Visibility Filter
    whereClause.OR = [
        { visibility: "HOUSEHOLD" },
        {
            visibility: "PARTICIPANTS",
            assignees: {
                some: {
                    member: {
                        userId: session.user.id
                    }
                }
            }
        }
    ]

    const tasks = await prisma.task.findMany({
        where: whereClause,
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{TEXTS.dashboard.tasks}</h2>
                <div className="flex items-center gap-2">
                    <MemberFilter members={members} />
                    <CreateTaskButton householdId={params.householdId} members={members} />
                </div>
            </div>

            <TaskListClient tasks={tasks} members={members} />
        </div>
    )
}
