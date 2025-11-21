"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full p-4 bg-white dark:bg-card border dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-opacity-80 transition-all"
        >
            <div className="flex items-center gap-3">
                {theme === "light" ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                    <Moon className="w-5 h-5 text-primary" />
                )}
                <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-foreground">
                        {theme === "light" ? "Mode clair" : "Mode sombre"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        {theme === "light" ? "Basculer en mode sombre" : "Basculer en mode clair"}
                    </p>
                </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-gray-300"
                }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"
                    }`} />
            </div>
        </button>
    )
}
