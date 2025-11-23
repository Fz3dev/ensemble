import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import NextImage from "next/image"
import { Calendar, CheckSquare, Home, Settings, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { householdId: string }
}) {
    const session = await auth()
    if (!session) redirect("/login")

    // Check if user still has a member in this household
    const member = await prisma.member.findFirst({
        where: {
            householdId: params.householdId,
            userId: session.user?.id
        }
    })

    // If user was removed from this household, redirect to onboarding
    if (!member) {
        redirect("/onboarding/choice")
    }

    return (
        <div className="flex min-h-screen flex-col bg-background pb-24">
            {/* Header Mobile - Minimalist */}
            <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-6 py-4 backdrop-blur-xl">
                <Link href={`/household/${params.householdId}`} className="flex items-center gap-3">
                    <div className="relative h-8 w-10">
                        <NextImage
                            src="/logo.png?v=2"
                            alt="Logo"
                            fill
                            sizes="40px"
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-primary font-serif">Ensemble</h1>
                </Link>
                <NotificationBell />
            </header>

            <main className="flex-1 px-4 pt-2">
                {children}
            </main>



            {/* Modern Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/90 pb-safe backdrop-blur-xl dark:bg-card/90">
                <div className="flex justify-around items-center p-2">
                    <Link href={`/household/${params.householdId}`} className="group flex flex-col items-center p-3 transition-colors hover:text-primary">
                        <Home className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="mt-1 text-[10px] font-medium text-muted-foreground group-hover:text-primary">Accueil</span>
                    </Link>
                    <Link href={`/household/${params.householdId}/calendar`} className="group flex flex-col items-center p-3 transition-colors hover:text-primary">
                        <Calendar className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="mt-1 text-[10px] font-medium text-muted-foreground group-hover:text-primary">Planning</span>
                    </Link>
                    <Link href={`/household/${params.householdId}/tasks`} className="group flex flex-col items-center p-3 transition-colors hover:text-primary">
                        <CheckSquare className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="mt-1 text-[10px] font-medium text-muted-foreground group-hover:text-primary">Tâches</span>
                    </Link>
                    <Link href={`/household/${params.householdId}/settings`} className="group flex flex-col items-center p-3 transition-colors hover:text-primary">
                        <Settings className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="mt-1 text-[10px] font-medium text-muted-foreground group-hover:text-primary">Réglages</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
