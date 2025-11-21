"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, Calendar as CalendarIcon, Tag, Trash2, Users, Pencil, Copy } from "lucide-react"
import { deleteEvent } from "@/server/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TEXTS } from "@/lib/constants/texts"
import { EventEditForm } from "@/components/event-edit-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EventDetailsDrawerProps {
    event: any | null
    members: any[]
    isOpen: boolean
    onClose: () => void
}

export function EventDetailsDrawer({ event, members, isOpen, onClose }: EventDetailsDrawerProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    if (!event) return null

    const handleDelete = async (deleteSeries: boolean = false) => {
        setIsDeleting(true)
        const result = await deleteEvent(event.id, deleteSeries)
        setIsDeleting(false)

        if (result.success) {
            toast.success(TEXTS.event.deleteSingle)
            onClose()
            router.refresh()
        } else {
            toast.error(TEXTS.errors.generic)
        }
    }

    const handleEditSuccess = () => {
        setIsEditing(false)
        onClose()
        router.refresh()
    }

    // Get participant details
    const participants = event.participants?.map((p: any) =>
        members.find(m => m.id === p.memberId)
    ).filter(Boolean) || []

    return (
        <Drawer open={isOpen} onOpenChange={(open) => {
            if (!open) setIsEditing(false)
            onClose()
        }}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-center">
                            {isEditing ? TEXTS.event.edit : event.title}
                        </DrawerTitle>
                        {!isEditing && (
                            <DrawerDescription className="text-center">
                                {TEXTS.event.details}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>

                    {isEditing ? (
                        <EventEditForm
                            event={event}
                            members={members}
                            onCancel={() => setIsEditing(false)}
                            onSuccess={handleEditSuccess}
                        />
                    ) : (
                        <>
                            <div className="p-4 space-y-6">
                                {/* Time */}
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl">
                                    <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm text-primary">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{TEXTS.event.time}</p>
                                        <p className="font-semibold">
                                            {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                                        </p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl">
                                    <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm text-primary">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{TEXTS.event.date}</p>
                                        <p className="font-semibold capitalize">
                                            {format(new Date(event.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                                        </p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl">
                                    <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm text-primary">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{TEXTS.event.category}</p>
                                        <p className="font-semibold capitalize">
                                            {event.category.toLowerCase()}
                                        </p>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl">
                                    <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm text-primary">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{TEXTS.dashboard.members}</p>
                                        {participants.length > 0 ? (
                                            <div className="flex -space-x-2 mt-1">
                                                {participants.map((member: any) => {
                                                    const displayName = member.nickname || member.user?.name || "Membre"
                                                    const initials = displayName[0] || "?"
                                                    return (
                                                        <Avatar key={member.id} className="border-2 border-white w-8 h-8">
                                                            <AvatarImage src={member.user?.image || undefined} />
                                                            <AvatarFallback style={{ backgroundColor: member.color }} className="text-white text-[10px]">
                                                                {initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">-</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DrawerFooter>
                                <div className="flex gap-2 w-full">
                                    <Button className="flex-1" onClick={() => setIsEditing(true)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        {TEXTS.event.edit}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            onClose()
                                            router.push(`/household/${event.householdId}/calendar/new?sourceEventId=${event.id}`)
                                        }}
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        {TEXTS.common.duplicate || "Dupliquer"}
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{TEXTS.common.confirm}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {event.seriesId ? TEXTS.event.seriesWarning : TEXTS.event.deleteSingle}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
                                                <AlertDialogCancel>{TEXTS.common.cancel}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(false)}>
                                                    {TEXTS.event.deleteSingle}
                                                </AlertDialogAction>
                                                {event.seriesId && (
                                                    <AlertDialogAction onClick={() => handleDelete(true)} className="bg-red-600 hover:bg-red-700">
                                                        {TEXTS.event.deleteSeries}
                                                    </AlertDialogAction>
                                                )}
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <DrawerClose asChild>
                                    <Button variant="outline">{TEXTS.common.close}</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
