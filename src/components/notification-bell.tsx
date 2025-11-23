"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationList } from "./notification-list"
import { useEffect, useState } from "react"
import { getNotifications, markAllNotificationsAsRead } from "@/server/actions"
import { cn } from "@/lib/utils"

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<any[]>([])

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.read).length)
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead()
        setUnreadCount(0)
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1"
                            onClick={handleMarkAllRead}
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>
                <NotificationList
                    notifications={notifications}
                    onRead={() => fetchNotifications()}
                    onClose={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    )
}
