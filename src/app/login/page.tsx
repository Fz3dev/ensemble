"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { register } from "@/server/actions"
import { signIn } from "next-auth/react"
import { PageTransition } from "@/components/animations"
import { Eye, EyeOff } from "lucide-react"
import { TEXTS } from "@/lib/constants/texts"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import NextImage from "next/image"

export default function LoginPage() {
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const result = await signIn("credentials", {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirect: false,
        })

        if (result?.error) {
            toast.error("Email ou mot de passe incorrect")
            setIsSubmitting(false)
        } else {
            router.push("/")
            router.refresh()
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const result = await register(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsSubmitting(false)
        }
        // Success redirects automatically
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
            {/* Abstract Background Shapes */}
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[100px]" />
            <div className="absolute -bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-pink-400/20 blur-[100px]" />

            <PageTransition className="z-10 w-full max-w-md p-4">
                <div className="mb-2 text-center">
                    <div className="relative h-16 w-24 mx-auto mb-2">
                        <NextImage
                            src="/logo.png?v=2"
                            alt="Logo"
                            fill
                            sizes="96px"
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-primary font-serif">Ensemble</h1>
                    <p className="mt-1 text-lg text-muted-foreground">
                        {TEXTS.auth.loginTagline}
                    </p>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/20 bg-white/70 p-5 shadow-2xl backdrop-blur-xl dark:bg-black/50">
                    <div className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    name="email"
                                    placeholder={TEXTS.auth.email}
                                    type="email"
                                    required
                                    className="h-12 rounded-xl border-transparent bg-white/50 px-4 transition-all hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />
                                <div className="relative">
                                    <Input
                                        name="password"
                                        placeholder={TEXTS.auth.password}
                                        type={showLoginPassword ? "text" : "password"}
                                        required
                                        className="h-12 rounded-xl border-transparent bg-white/50 px-4 pr-12 transition-all hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {showLoginPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button
                                className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Connexion..." : "Se connecter"}
                            </Button>
                        </form>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-transparent px-2 text-muted-foreground">
                                Nouveau ici ?
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Input name="name" placeholder="Votre prénom" required className="h-12 rounded-xl border-transparent bg-white/50 px-4 hover:bg-white focus:border-primary focus:bg-white" />
                            <Input name="email" placeholder="Email" type="email" required className="h-12 rounded-xl border-transparent bg-white/50 px-4 hover:bg-white focus:border-primary focus:bg-white" />
                            <div className="relative">
                                <Input
                                    name="password"
                                    placeholder="Mot de passe"
                                    type={showRegisterPassword ? "text" : "password"}
                                    required
                                    className="h-12 rounded-xl border-transparent bg-white/50 px-4 pr-12 hover:bg-white focus:border-primary focus:bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showRegisterPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 w-full rounded-xl border-2 hover:bg-accent hover:text-accent-foreground"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Création..." : "Créer un compte"}
                        </Button>
                    </form>
                </div>
            </PageTransition>
        </div>
    )
}
