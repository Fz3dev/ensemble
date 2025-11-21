import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MembersClient } from "@/components/members-client"

export default async function MembersPage({
    params,
}: {
    params: { householdId: string }
}) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    // Fetch all household members
    const members = await prisma.member.findMany({
        where: { householdId: params.householdId },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            type: "asc", // ADULT first, then CHILD, then PET
        },
    })

    // Check if current user is admin
    const currentUserMember = members.find((m) => m.userId === session.user?.id)
    const isAdmin = currentUserMember?.role === "ADMIN"

    return <MembersClient householdId={params.householdId} members={members} currentUserId={session.user?.id!} isAdmin={isAdmin} />
}
