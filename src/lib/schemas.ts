import { z } from "zod"

export const EventSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
    category: z.enum(["CHORE", "APPOINTMENT", "ACTIVITY", "MEAL", "OTHER", "SCHOOL", "WORK", "HEALTH", "SPORT", "LEISURE"]),
    participantIds: z.array(z.string()).optional(),
})

export const CreateEventSchema = EventSchema.extend({
    dates: z.string().transform((str, ctx) => {
        try {
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Au moins une date est requise",
                });
                return z.NEVER;
            }
            return parsed as string[];
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Format de date invalide",
            });
            return z.NEVER;
        }
    }),
})

export const UpdateEventSchema = EventSchema.partial().extend({
    date: z.string().optional(), // Optional date field for updating event date
})

export const TaskSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),
    dueDate: z.string().optional(), // ISO string
    assigneeIds: z.array(z.string()).optional(),
})

export const CreateTaskSchema = TaskSchema

export const MemberSchema = z.object({
    type: z.enum(["ADULT", "CHILD", "PET"]).default("CHILD"),
    name: z.string().min(1, "Le nom est requis"),
    age: z.coerce.number().min(0).max(120).optional(),
    petType: z.enum(["DOG", "CAT", "BIRD", "FISH", "RABBIT", "HAMSTER", "OTHER"]).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, "Couleur invalide").optional(),
})

export const CreateMemberSchema = MemberSchema

export const JoinHouseholdSchema = z.object({
    inviteCode: z.string().min(1, "Le code d'invitation est requis"),
})
