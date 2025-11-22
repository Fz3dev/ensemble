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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TEXTS } from "@/lib/constants/texts"
import { EventForm } from "@/components/event-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { generateGoogleCalendarLink, generateICSFile } from "@/lib/utils"
import { CalendarPlus, ExternalLink, Download, MoreHorizontal } from "lucide-react"

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
    const [isDuplicating, setIsDuplicating] = useState(false)

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

    const handleDuplicateSuccess = () => {
        setIsDuplicating(false)
        onClose()
        router.refresh()
    }

    // Get participant details
    const participants = event.participants?.map((p: any) =>
        members.find(m => m.id === p.memberId)
    ).filter(Boolean) || []

    return (
        <Drawer open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setIsEditing(false)
                setIsDuplicating(false)
            }
            onClose()
        }}>
            <DrawerContent className="h-[75vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-center">
                            {isDuplicating ? "Dupliquer l'événement" : isEditing ? TEXTS.event.edit : event.title}
                        </DrawerTitle>
                        {!isEditing && !isDuplicating && (
                            <DrawerDescription className="text-center">
                                {TEXTS.event.details}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>

                    {isDuplicating ? (
                        <EventForm
                            mode="create"
                            householdId={event.householdId}
                            members={members}
                            initialData={{
                                ...event,
                                startTime: undefined, // Force user to select a new date
                                endTime: undefined,
                                defaultStartTime: event.startTime,
                                defaultEndTime: event.endTime
                            }}
                            onSuccess={handleDuplicateSuccess}
                            onCancel={() => setIsDuplicating(false)}
                        />
                    ) : isEditing ? (
                        <EventForm
                            mode="edit"
                            event={event}
                            eventId={event.id}
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
                                            {format(new Date(event.startTime), "HH:mm") === "00:00" && format(new Date(event.endTime), "HH:mm") === "23:59"
                                                ? "Toute la journée"
                                                : `${format(new Date(event.startTime), "HH:mm")} - ${format(new Date(event.endTime), "HH:mm")}`
                                            }
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

                            <DrawerFooter className="pt-2">
                                <div className="flex gap-3 w-full">
                                    {/* Agenda Button */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="flex-1">
                                                <CalendarPlus className="w-4 h-4 mr-2" />
                                                Agenda
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => window.open(generateGoogleCalendarLink(event), '_blank')}>
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Google Calendar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                const url = generateICSFile(event)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = `${event.title}.ics`
                                                a.click()
                                                URL.revokeObjectURL(url)
                                            }}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Apple / Outlook (.ics)
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Edit Button */}
                                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsEditing(true)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        {TEXTS.event.edit}
                                    </Button>

                                    {/* More Options (Duplicate / Delete) */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="shrink-0">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setIsDuplicating(true)}>
                                                <Copy className="w-4 h-4 mr-2" />
                                                {TEXTS.common.duplicate || "Dupliquer"}
                                            </DropdownMenuItem>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {TEXTS.common.delete}
                                                    </DropdownMenuItem>
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
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full mt-2 text-muted-foreground">
                                        {TEXTS.common.close}
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
