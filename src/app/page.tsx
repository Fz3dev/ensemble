import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Check if user is already a member of a household
    const member = await prisma.member.findFirst({
        where: { userId: session.user.id }
    });

    if (member) {
        redirect(`/household/${member.householdId}`);
    }

    // If not a member, go to onboarding choice
    redirect("/onboarding/choice");
}
