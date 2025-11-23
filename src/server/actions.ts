"use server"

// Force recompile

import { signIn, signOut } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { format } from "date-fns"
import { auth } from "@/auth"
import { CreateEventSchema, UpdateEventSchema, CreateTaskSchema, CreateMemberSchema, JoinHouseholdSchema } from "@/lib/schemas"
import { MEMBER_COLORS } from "@/lib/utils"

const prisma = new PrismaClient()

// --- Auth Actions ---

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export async function register(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  const { email, password, name } = validatedFields.data

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return { error: "User already exists" }

    // Create user
    await prisma.user.create({
      data: {
        email,
        password, // In prod, hash this!
        name,
      },
    })
  } catch (error) {
    return { error: "Database Error" }
  }

  // Attempt login
  await signIn("credentials", { email, password, redirect: false })
  redirect("/onboarding/choice")
}

export async function logoutAction() {
  await signOut({ redirect: false })
  redirect("/login")
}

// --- Household Actions ---

export async function createHousehold(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const name = formData.get("name") as string
  if (!name) return { error: "Name required" }

  try {
    // Generate complex invite code (12 chars: letters + numbers)
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      let code = ''
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    const household = await prisma.household.create({
      data: {
        name,
        inviteCode: generateInviteCode(),
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
            color: MEMBER_COLORS[0].value, // Default blue from palette
            type: "ADULT"
          },
        },
      },
    })

    revalidatePath("/dashboard")
    return { success: true, householdId: household.id, inviteCode: household.inviteCode }
  } catch (error) {
    return { error: "Failed to create household" }
  }
}

export async function joinHousehold(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Not authenticated" }

  const validatedFields = JoinHouseholdSchema.safeParse({
    inviteCode: formData.get("inviteCode")
  })

  if (!validatedFields.success) {
    return { success: false, error: "Code d'invitation requis" }
  }

  const { inviteCode } = validatedFields.data

  try {
    const household = await prisma.household.findUnique({
      where: { inviteCode }
    })

    if (!household) return { success: false, error: "Code d'invitation invalide" }

    // Check if already member
    const existingMember = await prisma.member.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId: household.id
        }
      }
    })

    if (existingMember) return { success: false, error: "Vous êtes déjà membre de cette famille" }

    // Check if there's already a pending request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId: household.id
        }
      }
    })

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return { success: true, pending: true }
      }
      if (existingRequest.status === "REJECTED") {
        return { success: false, error: "Votre demande a été refusée" }
      }
    }

    // Create join request
    await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        householdId: household.id,
        status: "PENDING"
      }
    })

    await notifyAdminsOfJoinRequest(household.id, session.user.name || "Utilisateur")

    return { success: true, pending: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Erreur lors de la demande" }
  }
}

// Helper to notify admins
async function notifyAdminsOfJoinRequest(householdId: string, userName: string) {
  const admins = await prisma.member.findMany({
    where: { householdId, role: "ADMIN", userId: { not: null } }
  })

  for (const admin of admins) {
    if (admin.userId) {
      await createNotification({
        userId: admin.userId,
        householdId,
        type: "JOIN_REQUEST",
        title: "Nouvelle demande d'adhésion",
        message: `${userName || "Un utilisateur"} souhaite rejoindre votre famille.`
      })
    }
  }
}

export async function approveJoinRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        household: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        },
        user: true
      }
    })

    if (!request) return { error: "Demande introuvable" }

    // Check if current user is admin of this household
    const userMember = request.household.members[0]
    if (!userMember || userMember.role !== "ADMIN") {
      return { error: "Non autorisé" }
    }

    // Create member and update request status
    await prisma.$transaction([
      prisma.member.create({
        data: {
          userId: request.userId,
          householdId: request.householdId,
          role: "MEMBER",
          color: "#10b981",
          type: "ADULT"
        }
      }),
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      })
    ])

    // Notify User
    await createNotification({
      userId: request.userId,
      householdId: request.householdId,
      type: "JOIN_ACCEPTED",
      title: "Demande acceptée !",
      message: `Bienvenue dans la famille ${request.household.name} !`,
      resourceId: request.householdId
    })

    revalidatePath(`/household/${request.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Erreur lors de l'approbation" }
  }
}

export async function rejectJoinRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        household: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!request) return { error: "Demande introuvable" }

    // Check if current user is admin
    const userMember = request.household.members[0]
    if (!userMember || userMember.role !== "ADMIN") {
      return { error: "Non autorisé" }
    }

    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    })

    revalidatePath(`/household/${request.householdId}`)
    return { success: true }
  } catch (error) {
    return { error: "Erreur lors du refus" }
  }
}


// --- Member Actions ---

export async function addMember(householdId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const rawData = {
    type: formData.get("type"),
    name: formData.get("name"),
    age: formData.get("age") || undefined,
    petType: formData.get("petType") || undefined,
    color: formData.get("color") || undefined,
  }

  const validatedFields = CreateMemberSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Member validation failed:", validatedFields.error)
    return { error: "Données invalides" }
  }

  const { type, name, age, petType, color } = validatedFields.data

  try {
    // Verify user is member of household
    const userMember = await prisma.member.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId
        }
      }
    })

    if (!userMember) return { error: "Not authorized" }

    await prisma.member.create({
      data: {
        type,
        nickname: name,
        age,
        petType,
        color: color || MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)].value, // Random palette color if not specified
        householdId,
        userId: null, // Children and pets don't have user accounts
      }
    })

    // Notify all other users in the household
    const usersToNotify = await prisma.member.findMany({
      where: { householdId, userId: { not: null } }
    })

    for (const member of usersToNotify) {
      if (member.userId && member.userId !== session.user.id) {
        await createNotification({
          userId: member.userId,
          householdId,
          type: "MEMBER_ADDED",
          title: "Nouveau membre ajouté",
          message: `${session.user.name} a ajouté ${type === "CHILD" ? "un enfant" : "un animal"} : ${name}`
        })
      }
    }

    revalidatePath(`/household/${householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to add member" }
  }
}

export async function updateMember(memberId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const rawData = {
    type: formData.get("type"),
    name: formData.get("name"),
    age: formData.get("age") || undefined,
    petType: formData.get("petType") || undefined,
    color: formData.get("color") || undefined,
  }

  const validatedFields = CreateMemberSchema.partial().safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Données invalides" }
  }

  const { name, age, petType, color } = validatedFields.data

  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return { error: "Member not found" }

    // Check if current user is admin
    const currentUserMember = await prisma.member.findFirst({
      where: {
        householdId: member.householdId,
        userId: session.user.id
      }
    })
    const isAdmin = currentUserMember?.role === "ADMIN"

    // If member has a userId (adult)
    if (member.userId) {
      // Admins can edit anyone's color, or user can edit own profile
      if (!isAdmin && member.userId !== session.user.id) {
        return { error: "Cannot edit other adult members" }
      }

      // Admins can only update color for other adults
      // Users can update their own nickname and color
      if (isAdmin && member.userId !== session.user.id) {
        await prisma.member.update({
          where: { id: memberId },
          data: { color }
        })
      } else {
        await prisma.member.update({
          where: { id: memberId },
          data: {
            nickname: name,
            color,
          }
        })
      }
    } else {
      // For children/pets, allow all updates (admins or anyone)
      await prisma.member.update({
        where: { id: memberId },
        data: {
          nickname: name,
          age,
          petType,
          color,
        }
      })
    }

    revalidatePath(`/household/${member.householdId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update member" }
  }
}

export async function deleteMember(memberId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return { error: "Member not found" }

    // Check if current user is admin
    const currentUserMember = await prisma.member.findFirst({
      where: {
        householdId: member.householdId,
        userId: session.user.id
      }
    })
    const isAdmin = currentUserMember?.role === "ADMIN"

    // Prevent self-deletion
    if (member.userId === session.user.id) {
      return { error: "Cannot delete your own account" }
    }

    // Only admins can delete adult members with user accounts
    if (member.userId && !isAdmin) {
      return { error: "Cannot delete adult members" }
    }

    await prisma.member.delete({ where: { id: memberId } })

    revalidatePath(`/household/${member.householdId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete member" }
  }
}


// --- Event Actions ---

export async function createEvent(householdId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  // Parse FormData to Object
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    dates: formData.get("dates"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    category: formData.get("category"),
    visibility: formData.get("visibility"),
    participantIds: formData.getAll("participantIds"),
  }

  // Validate with Zod
  const validatedFields = CreateEventSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error)
    return { error: "Données invalides" }
  }

  const { title, description, dates, startTime, endTime, category, visibility, participantIds } = validatedFields.data

  try {
    // Create a series if there are multiple dates
    let seriesId: string | undefined = undefined

    if (dates.length > 1) {
      const series = await prisma.eventSeries.create({ data: {} })
      seriesId = series.id
    }

    // Create all events
    const eventsData = dates.map(dateStr => {
      const startDateTime = new Date(`${dateStr}T${startTime}`)
      const endDateTime = new Date(`${dateStr}T${endTime}`)

      return {
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        category,
        visibility,
        householdId,
        seriesId,
        // Participants are handled separately or via nested create if supported
      }
    })

    // Create events and participants
    // Since we can't easily do nested createMany for SQLite/Prisma in one go with relations for multiple events,
    // we'll loop.
    await Promise.all(eventsData.map(async (data) => {
      const event = await prisma.event.create({ data })

      if (participantIds && participantIds.length > 0) {
        // We need to find the Member IDs for these users/household
        // Assuming participantIds passed are Member IDs directly
        await prisma.eventParticipant.createMany({
          data: participantIds.map(memberId => ({
            eventId: event.id,
            memberId
          }))
        })

        // Notify Participants
        const members = await prisma.member.findMany({
          where: { id: { in: participantIds }, userId: { not: null } }
        })

        for (const member of members) {
          if (member.userId && member.userId !== session.user?.id) {
            await createNotification({
              userId: member.userId,
              householdId,
              type: "EVENT_INVITE",
              title: "Invitation à un événement",
              message: `${session.user?.name || "Un membre"} vous a ajouté à l'événement "${title}"`,
            })
          }
        }
      }
    }))

    revalidatePath(`/household/${householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Erreur lors de la création de l'événement" }
  }
}

export async function deleteEvent(eventId: string, deleteSeries: boolean = false) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: { include: { member: true } } }
    })
    if (!event) return { error: "Event not found" }

    // Notify participants before deletion
    for (const p of event.participants) {
      if (p.member.userId && p.member.userId !== session.user.id) {
        await createNotification({
          userId: p.member.userId,
          householdId: event.householdId,
          type: "EVENT_DELETED",
          title: "Événement annulé",
          message: `L'événement "${event.title}" a été supprimé par ${session.user.name || "un membre"}.`,
        })
      }
    }

    if (deleteSeries && event.seriesId) {
      await prisma.event.deleteMany({ where: { seriesId: event.seriesId } })
      await prisma.eventSeries.delete({ where: { id: event.seriesId } })
    } else {
      await prisma.event.delete({ where: { id: eventId } })
    }

    revalidatePath(`/household/${event.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to delete event" }
  }
}

export async function updateEvent(eventId: string, formData: FormData, updateSeries: boolean = false) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"), // Get the new date from form
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    category: formData.get("category"),
    visibility: formData.get("visibility"),
    participantIds: formData.getAll("participantIds"),
  }

  // Validate partial update
  const validatedFields = UpdateEventSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Données invalides" }
  }

  const { title, description, date, startTime, endTime, category, visibility, participantIds } = validatedFields.data

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: { include: { member: true } } }
    })
    if (!event) return { error: "Event not found" }

    const dataToUpdate: any = {}
    if (title) dataToUpdate.title = title
    if (description !== undefined) dataToUpdate.description = description
    if (category) dataToUpdate.category = category
    if (visibility) dataToUpdate.visibility = visibility

    // Helper to update participants
    const updateParticipants = async (targetEventId: string) => {
      if (participantIds) {
        // Remove existing
        await prisma.eventParticipant.deleteMany({ where: { eventId: targetEventId } })
        // Add new
        if (participantIds.length > 0) {
          await prisma.eventParticipant.createMany({
            data: participantIds.map(memberId => ({
              eventId: targetEventId,
              memberId
            }))
          })
        }
      }
    }

    if (updateSeries && event.seriesId) {
      // Update all events in series
      const events = await prisma.event.findMany({ where: { seriesId: event.seriesId } })

      await Promise.all(events.map(async (ev: any) => {
        const newStart = startTime ? new Date(`${format(ev.startTime, 'yyyy-MM-dd')}T${startTime}`) : ev.startTime
        const newEnd = endTime ? new Date(`${format(ev.endTime, 'yyyy-MM-dd')}T${endTime}`) : ev.endTime

        await prisma.event.update({
          where: { id: ev.id },
          data: { ...dataToUpdate, startTime: newStart, endTime: newEnd }
        })

        await updateParticipants(ev.id)
      }))

    } else {
      // Single event update
      // Parse the new date if provided
      let newDate = format(event.startTime, 'yyyy-MM-dd')
      if (date) {
        try {
          // Try parsing as JSON array first (from MultiDatePicker)
          const parsedDates = JSON.parse(date)
          if (Array.isArray(parsedDates) && parsedDates.length > 0) {
            newDate = format(new Date(parsedDates[0]), 'yyyy-MM-dd')
          }
        } catch (e) {
          // If JSON parse fails, it might be a simple date string or invalid
          // Verify if it's a valid date string
          const validDate = new Date(date)
          if (!isNaN(validDate.getTime())) {
            newDate = format(validDate, 'yyyy-MM-dd')
          }
        }
      }

      // Combine new date with times
      if (startTime) {
        dataToUpdate.startTime = new Date(`${newDate}T${startTime}`)
      } else if (date) {
        // If only date changed, keep the original time
        dataToUpdate.startTime = new Date(`${newDate}T${format(event.startTime, 'HH:mm')}`)
      }

      if (endTime) {
        dataToUpdate.endTime = new Date(`${newDate}T${endTime}`)
      } else if (date) {
        // If only date changed, keep the original time
        dataToUpdate.endTime = new Date(`${newDate}T${format(event.endTime, 'HH:mm')}`)
      }

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: dataToUpdate
      })

      await updateParticipants(eventId)

      // Notify participants if time/date changed
      if (startTime || endTime || date) {
        const oldStart = format(event.startTime, "dd/MM/yyyy à HH:mm")
        const newStart = format(updatedEvent.startTime, "dd/MM/yyyy à HH:mm")

        for (const p of event.participants) {
          if (p.member.userId && p.member.userId !== session.user.id) {
            await createNotification({
              userId: p.member.userId,
              householdId: event.householdId,
              type: "EVENT_UPDATED",
              title: "Événement modifié",
              message: `L'événement "${event.title}" a été déplacé du ${oldStart} au ${newStart}.`,
              resourceId: event.id
            })
          }
        }
      }
    }

    revalidatePath(`/household/${event.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to update event" }
  }
}

// --- Task Actions ---

export async function createTask(householdId: string, formData: FormData) {
  console.log("--- createTask ACTION START ---")
  console.log("Household ID:", householdId)

  const session = await auth()
  console.log("Session User ID:", session?.user?.id)

  if (!session?.user?.id) {
    console.error("Auth failed: No session or user ID")
    return { error: "Not authenticated" }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    recurrence: formData.get("recurrence") || undefined,
    visibility: formData.get("visibility") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    assigneeIds: formData.getAll("assigneeIds"),
  }
  console.log("Raw Data from FormData:", JSON.stringify(rawData, null, 2))

  const validatedFields = CreateTaskSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Zod Validation Failed:", validatedFields.error.flatten())
    return { error: "Données invalides: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) }
  }

  const { title, description, recurrence, visibility, dueDate, assigneeIds } = validatedFields.data
  const emoji = formData.get("emoji") as string | null
  console.log("Validated Data:", { title, description, recurrence, visibility, dueDate, assigneeIds, emoji })

  try {
    console.log("Attempting Prisma Create...")
    const task = await prisma.task.create({
      data: {
        title,
        description,
        emoji,
        recurrence: recurrence as any, // Ensure this matches your Prisma schema type (String or Enum)
        visibility: visibility as any,
        dueDate: dueDate ? new Date(dueDate) : null,
        householdId,
        status: "TODO",
      }
    })
    console.log("Prisma Task Created:", task.id)

    if (assigneeIds && assigneeIds.length > 0) {
      console.log("Assigning members:", assigneeIds)
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map(memberId => ({
          taskId: task.id,
          memberId
        }))
      })
      console.log("Members assigned.")

      // Notify Assignees
      const members = await prisma.member.findMany({
        where: { id: { in: assigneeIds }, userId: { not: null } }
      })

      for (const member of members) {
        if (member.userId && member.userId !== session.user.id) {
          await createNotification({
            userId: member.userId,
            householdId,
            type: "TASK_ASSIGNED",
            title: "Nouvelle tâche assignée",
            message: `${session.user.name} vous a assigné la tâche "${title}"`,
            resourceId: task.id
          })
        }
      }
    }

    revalidatePath(`/household/${householdId}/tasks`)
    console.log("--- createTask ACTION SUCCESS ---")
    return { success: true }
  } catch (error) {
    console.error("--- createTask ACTION ERROR ---")
    console.error(error)
    return { error: "Failed to create task: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function toggleTask(taskId: string, currentStatus: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const newStatus = currentStatus === "DONE" ? "TODO" : "DONE"

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return { error: "Task not found" }

    // If completing a recurring task, we might want to reset it or create a new one.
    // For MVP: If recurring and setting to DONE, we reset status to TODO and update dueDate based on recurrence.
    // If not recurring, just toggle status.

    if (newStatus === "DONE" && task.recurrence !== "NONE") {
      let nextDate = task.dueDate ? new Date(task.dueDate) : new Date()

      if (task.recurrence === "DAILY") nextDate.setDate(nextDate.getDate() + 1)
      if (task.recurrence === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7)
      if (task.recurrence === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1)

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "TODO",
          dueDate: nextDate,
          completedAt: new Date(),
          completedBy: session.user.id // Ideally we map this to Member ID, but for now User ID is okay or we fetch Member
        }
      })
    } else {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: newStatus as any,
          completedAt: newStatus === "DONE" ? new Date() : null,
          completedBy: newStatus === "DONE" ? session.user.id : null
        }
      })
    }

    // Notify Household Members if task completed
    if (newStatus === "DONE") {
      const members = await prisma.member.findMany({
        where: { householdId: task.householdId, userId: { not: null } }
      })

      for (const member of members) {
        if (member.userId && member.userId !== session.user.id) {
          await createNotification({
            userId: member.userId,
            householdId: task.householdId,
            type: "TASK_COMPLETED",
            title: "Tâche terminée",
            message: `${session.user.name} a terminé la tâche "${task.title}"`,
            resourceId: task.id
          })
        }
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update task" }
  }
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return { error: "Task not found" }

    await prisma.task.delete({ where: { id: taskId } })

    revalidatePath(`/household/${task.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to delete task" }
  }
}

export async function updateTask(taskId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return { error: "Task not found" }

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const emoji = formData.get("emoji") as string | null
    const recurrence = formData.get("recurrence") as string
    const visibility = formData.get("visibility") as string
    const dueDate = formData.get("dueDate") as string | null
    const assigneeIds = formData.getAll("assigneeIds") as string[]

    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        emoji,
        recurrence: recurrence as any,
        visibility: visibility as any,
        dueDate: dueDate ? new Date(dueDate) : null,
      }
    })

    // Update assignees
    await prisma.taskAssignee.deleteMany({ where: { taskId } })
    if (assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map(memberId => ({
          taskId,
          memberId
        }))
      })
    }

    // Notify if due date changed
    const oldDueDate = task.dueDate
    const newDueDateObj = dueDate ? new Date(dueDate) : null

    if (oldDueDate?.getTime() !== newDueDateObj?.getTime()) {
      const assignees = await prisma.taskAssignee.findMany({
        where: { taskId },
        include: { member: true }
      })

      const formattedDate = newDueDateObj ? format(newDueDateObj, "dd/MM/yyyy") : "aucune date"

      for (const assignee of assignees) {
        if (assignee.member.userId && assignee.member.userId !== session.user.id) {
          await createNotification({
            userId: assignee.member.userId,
            householdId: task.householdId,
            type: "TASK_UPDATED",
            title: "Tâche modifiée",
            message: `La date de la tâche "${title}" a été modifiée pour le ${formattedDate}.`,
            resourceId: task.id
          })
        }
      }
    }

    revalidatePath(`/household/${task.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to update task" }
  }
}


// --- Notification Actions ---

export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return notifications
  } catch (error) {
    console.error("Failed to fetch notifications", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark as read" }
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark all as read" }
  }
}

// Helper to create notifications
async function createNotification(data: {
  userId: string
  householdId: string
  type: string
  title: string
  message: string
  resourceId?: string
}) {
  try {
    await prisma.notification.create({ data })
  } catch (error) {
    console.error("Failed to create notification", error)
  }
}
