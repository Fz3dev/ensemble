"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { markNotificationAsRead } from "@/server/actions"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Check, UserPlus, Calendar, CheckSquare, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotificationListProps {
    notifications: any[]
    onRead: () => void
    onClose?: () => void
}

export function NotificationList({ notifications, onRead, onClose }: NotificationListProps) {
    const router = useRouter()

    if (!notifications || notifications.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucune notification</p>
            </div>
        )
    }

    const handleClick = async (notification: any) => {
        // Mark as read if not already
        if (!notification.read) {
            await markNotificationAsRead(notification.id)
            onRead()
        }

        // Close popover if callback provided
        if (onClose) {
            onClose()
        }

        // Navigate based on type
        switch (notification.type) {
            case "JOIN_REQUEST":
                router.push(`/household/${notification.householdId}/settings`)
                break
            case "JOIN_ACCEPTED":
                router.push(`/household/${notification.householdId}`)
                break
            case "TASK_ASSIGNED":
            case "TASK_COMPLETED":
            case "TASK_UPDATED":
                router.push(`/household/${notification.householdId}/tasks`)
                break
            case "EVENT_INVITE":
            case "EVENT_UPDATED":
                router.push(`/household/${notification.householdId}`)
                break
            case "EVENT_DELETED":
                // Stay on dashboard or go to calendar, but event is gone so maybe just dashboard
                router.push(`/household/${notification.householdId}`)
                break
            case "MEMBER_ADDED":
                router.push(`/household/${notification.householdId}/members`)
                break
            default:
                break
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "JOIN_REQUEST":
            case "JOIN_ACCEPTED":
                return <UserPlus className="h-4 w-4 text-blue-500" />
            case "EVENT_INVITE":
            case "EVENT_UPDATED":
                return <Calendar className="h-4 w-4 text-purple-500" />
            case "EVENT_DELETED":
                return <Calendar className="h-4 w-4 text-red-500" />
            case "TASK_ASSIGNED":
            case "TASK_COMPLETED":
            case "TASK_UPDATED":
                return <CheckSquare className="h-4 w-4 text-green-500" />
            case "MEMBER_ADDED":
                return <UserPlus className="h-4 w-4 text-pink-500" />
            default:
                return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <ScrollArea className="h-[300px]">
            <div className="divide-y">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={cn(
                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3",
                            !notification.read ? "bg-secondary/30" : "bg-background"
                        )}
                        onClick={() => handleClick(notification)}
                    >
                        <div className="mt-1 flex-shrink-0">
                            {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className={cn("text-sm leading-none", !notification.read ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                                {notification.title}
                            </p>
                            <p className={cn("text-xs line-clamp-2", !notification.read ? "text-foreground/80" : "text-muted-foreground")}>
                                {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                            </p>
                        </div>
                        {!notification.read && (
                            <div className="flex-shrink-0 self-center">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
