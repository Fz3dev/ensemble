"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/server/actions"

export function LogoutButton() {
    const handleLogout = async () => {
        await logoutAction()
    }

    return (
        <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
        </Button>
    )
}
