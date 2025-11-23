import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import NextImage from "next/image"
import { Home, UserPlus, LogOut } from "lucide-react"
import { FadeIn, SlideIn } from "@/components/animations"
import { Button } from "@/components/ui/button"

export default async function OnboardingChoice() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    // If user already has a household, redirect to dashboard
    const member = await prisma.member.findFirst({
        where: { userId: session.user.id }
    })

    if (member) {
        redirect(`/household/${member.householdId}`)
    }

    return (
        <div className="h-screen flex flex-col items-center pt-12 bg-background p-6 overflow-hidden">
            <FadeIn className="text-center mb-6 flex flex-col items-center">
                <div className="relative h-16 w-24 mb-2">
                    <NextImage
                        src="/logo.png?v=2"
                        alt="Logo"
                        fill
                        sizes="96px"
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-4xl font-bold text-primary font-serif mb-2">
                    Ensemble
                </h1>
                <p className="text-gray-600 dark:text-muted-foreground text-lg">
                    Organisez votre vie de famille en toute simplicité
                </p>
            </FadeIn>

            <div className="w-full max-w-md space-y-4">
                <SlideIn delay={0.1} direction="up">
                    <Link
                        href="/onboarding/create-family"
                        className="block group relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl transition-all hover:shadow-2xl hover:scale-105"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <div className="relative flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Home className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-1">Créer ma famille</h2>
                                <p className="text-primary-foreground/80 text-sm">
                                    Commencez une nouvelle organisation familiale
                                </p>
                            </div>
                        </div>
                    </Link>
                </SlideIn>

                <SlideIn delay={0.2} direction="up">
                    <Link
                        href="/onboarding/join"
                        className="block group relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg border-2 border-border transition-all hover:shadow-xl hover:scale-105 hover:border-primary"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -mr-16 -mt-16" />
                        <div className="relative flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-foreground mb-1">Rejoindre une famille</h2>
                                <p className="text-muted-foreground text-sm">
                                    J"ai reçu un code d"invitation
                                </p>
                            </div>
                        </div>
                    </Link>
                </SlideIn>
            </div>

            <SlideIn delay={0.3} direction="up" className="mt-8 text-center text-sm text-gray-500">
                <p>Vous devez créer ou rejoindre une famille pour continuer</p>
            </SlideIn>

            <SlideIn delay={0.4} direction="up" className="mt-6">
                <form action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                }}>
                    <Button
                        type="submit"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                    </Button>
                </form>
            </SlideIn>
        </div>
    )
}
