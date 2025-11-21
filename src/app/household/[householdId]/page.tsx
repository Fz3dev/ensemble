import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarDays, CheckCircle2, Clock, Plus, ArrowRight } from "lucide-react"
import { FadeIn, ScaleIn } from "@/components/animations"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TEXTS } from "@/lib/constants/texts"
import { DashboardEvents } from "@/components/dashboard-events"

export default async function HouseholdPage({ params }: { params: { householdId: string } }) {
    const session = await auth()
    if (!session?.user) return null

    const nextEvents = await prisma.event.findMany({
        where: {
            householdId: params.householdId,
            startTime: { gte: new Date() }
        },
        orderBy: { startTime: 'asc' },
        take: 3,
        include: {
            series: true,
            participants: { include: { member: { include: { user: true } } } }
        }
    })

    const nextEvent = nextEvents[0]
    const upcomingEvents = nextEvents.slice(1)

    const members = await prisma.member.findMany({
        where: { householdId: params.householdId },
        include: { user: true }
    })

    // Get current user's member for avatar color
    const currentUserMember = members.find(m => m.userId === session.user.id)

    const tasks = await prisma.task.findMany({
        where: {
            householdId: params.householdId,
            status: "TODO"
        },
        take: 3
    })

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">
                        {TEXTS.dashboard.greeting} {session?.user?.name?.split(' ')[0]} !
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(new Date(), "EEEE d MMMM", { locale: fr })}
                    </p>
                </div>
                <div className="relative">
                    <div
                        className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: currentUserMember?.color || '#A17A6C' }}
                    >
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="h-full w-full object-cover rounded-full"
                            />
                        ) : (
                            <span className="text-lg font-semibold text-white">
                                {session.user.name?.[0]?.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <DashboardEvents
                nextEvent={nextEvent}
                upcomingEvents={upcomingEvents}
                members={members}
                householdId={params.householdId}
            />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <FadeIn delay={0.2}>
                    <Link href={`/household/${params.householdId}/calendar`} className="block group">
                        <Card className="h-full border-0 shadow-sm bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20 transition-colors">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CalendarDays className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-foreground">{TEXTS.navigation.calendar}</span>
                            </CardContent>
                        </Card>
                    </Link>
                </FadeIn>
                <FadeIn delay={0.3}>
                    <Link href={`/household/${params.householdId}/tasks`} className="block group">
                        <Card className="h-full border-0 shadow-sm bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 transition-colors">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-foreground">{TEXTS.navigation.tasks}</span>
                            </CardContent>
                        </Card>
                    </Link>
                </FadeIn>
            </div>

            {/* Tasks Preview */}
            <FadeIn delay={0.4}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">{TEXTS.dashboard.tasks}</h3>
                        <Button variant="ghost" size="sm" className="text-primary" asChild>
                            <Link href={`/household/${params.householdId}/tasks`}>Voir tout</Link>
                        </Button>
                    </div>

                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            {tasks.map((task: any) => (
                                <Card key={task.id} className="border-none bg-white shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                                        <span className="font-medium text-foreground">{task.title}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed shadow-none bg-gray-50/50">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p>{TEXTS.dashboard.noTasks}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </FadeIn>
        </div>
    )
}
