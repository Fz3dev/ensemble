import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { InviteCodeDisplay } from "@/components/invite-code-display"
import { JoinRequestCard } from "@/components/join-request-card"
import { UserPlus, Settings, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"

interface PageProps {
    params: {
        householdId: string
    }
}

export default async function HouseholdSettingsPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const { householdId } = await params

    // Get household and check if user is member
    const household = await prisma.household.findUnique({
        where: { id: householdId },
        include: {
            members: true, // Fetch all members to get correct count
            joinRequests: {
                where: { status: "PENDING" },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    })

    if (!household || !household.members.some(m => m.userId === session?.user?.id)) {
        redirect("/onboarding/choice")
    }

    const userMember = household.members.find(m => m.userId === session?.user?.id)
    if (!userMember) redirect("/onboarding/choice")

    const isAdmin = userMember.role === "ADMIN"

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Paramètres</h2>
            </div>

            <div className="space-y-8">
                {/* Household Info */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">{household.name}</h3>
                    <p className="text-muted-foreground">
                        {household.members.length} membre{household.members.length > 1 ? "s" : ""}
                    </p>
                </div>

                {/* Member Management Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Gérer ma famille</h3>
                    </div>
                    <Link
                        href={`/household/${householdId}/members`}
                        className="block p-4 bg-white dark:bg-card border rounded-lg hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-foreground">Membres de la famille</p>
                                <p className="text-sm text-muted-foreground">Gérer les profils, enfants et animaux</p>
                            </div>
                            <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </Link>
                </div>

                {/* Invite Section (Admin only) */}
                {isAdmin && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">Inviter des membres</h3>
                        </div>

                        <InviteCodeDisplay
                            inviteCode={household.inviteCode}
                            householdName={household.name}
                        />
                    </div>
                )}

                {/* Appearance Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Apparence</h3>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Pending Join Requests (Admin only) */}
                {isAdmin && household.joinRequests.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Demandes en attente
                            </h3>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                {household.joinRequests.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {household.joinRequests.map((request: any) => (
                                <JoinRequestCard
                                    key={request.id}
                                    request={request}
                                    onUpdate={() => {
                                        // This will trigger a revalidation
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Coming soon sections */}
                <div className="border-t pt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-400">Bientôt disponible</h3>
                    <div className="grid gap-3">
                        <div className="p-4 bg-gray-100 dark:bg-muted/20 rounded-lg opacity-50">
                            <p className="font-medium">Préférences</p>
                            <p className="text-sm text-muted-foreground">Notifications, langue, thème</p>
                        </div>
                    </div>
                </div>

                {/* Logout Section */}
                <div className="border-t pt-6">
                    <LogoutButton />
                </div>
            </div>
        </div>
    )
}
