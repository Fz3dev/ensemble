import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // If authenticated, redirect to onboarding to select/create household
    // Or if we had a "last visited household" stored, we could go there.
    // For now, onboarding handles the "where to go" logic (join or create).
    redirect("/onboarding");
}
