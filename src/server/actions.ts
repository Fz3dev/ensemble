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

    return { success: true, pending: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Erreur lors de la demande" }
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

    // If member has a userId (adult), only allow updating nickname and color
    if (member.userId) {
      // Can only update own profile
      if (member.userId !== session.user.id) {
        return { error: "Cannot edit other adult members" }
      }

      // Only update nickname and color for adults
      await prisma.member.update({
        where: { id: memberId },
        data: {
          nickname: name,
          color,
        }
      })
    } else {
      // For children/pets, allow all updates
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

    // Only allow deleting children/pets (not adult members with user accounts)
    if (member.userId) return { error: "Cannot delete adult members" }

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
    dates: formData.get("dates"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    category: formData.get("category"),
    participantIds: formData.getAll("participantIds"),
  }

  // Validate with Zod
  const validatedFields = CreateEventSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error)
    return { error: "Données invalides" }
  }

  const { title, dates, startTime, endTime, category, participantIds } = validatedFields.data

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
        startTime: startDateTime,
        endTime: endDateTime,
        category,
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
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return { error: "Event not found" }

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
    date: formData.get("date"), // Get the new date from form
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    category: formData.get("category"),
    participantIds: formData.getAll("participantIds"),
  }

  // Validate partial update
  const validatedFields = UpdateEventSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Données invalides" }
  }

  const { title, date, startTime, endTime, category, participantIds } = validatedFields.data

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return { error: "Event not found" }

    const dataToUpdate: any = {}
    if (title) dataToUpdate.title = title
    if (category) dataToUpdate.category = category

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

      await prisma.event.update({
        where: { id: eventId },
        data: dataToUpdate
      })

      await updateParticipants(eventId)
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
    dueDate: formData.get("dueDate") || undefined,
    assigneeIds: formData.getAll("assigneeIds"),
  }
  console.log("Raw Data from FormData:", JSON.stringify(rawData, null, 2))

  const validatedFields = CreateTaskSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Zod Validation Failed:", validatedFields.error.flatten())
    return { error: "Données invalides: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) }
  }

  const { title, description, recurrence, dueDate, assigneeIds } = validatedFields.data
  const emoji = formData.get("emoji") as string | null
  console.log("Validated Data:", { title, description, recurrence, dueDate, assigneeIds, emoji })

  try {
    console.log("Attempting Prisma Create...")
    const task = await prisma.task.create({
      data: {
        title,
        description,
        emoji,
        recurrence: recurrence as any, // Ensure this matches your Prisma schema type (String or Enum)
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
    const dueDate = formData.get("dueDate") as string | null
    const assigneeIds = formData.getAll("assigneeIds") as string[]

    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        emoji,
        recurrence: recurrence as any,
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

    revalidatePath(`/household/${task.householdId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to update task" }
  }
}
