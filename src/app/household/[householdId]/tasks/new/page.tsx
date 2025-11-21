import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTask } from "@/server/actions"
import { redirect } from "next/navigation"

export default function NewTaskPage({ params }: { params: { householdId: string } }) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Nouvelle tâche</h2>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <form
                    action={async (formData) => {
                        "use server"
                        const res = await createTask(params.householdId, formData)
                        if (res?.success) redirect(`/household/${params.householdId}/tasks`)
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="text-sm font-medium">Titre</label>
                        <Input name="title" placeholder="Ex: Faire les courses" required />
                    </div>

                    <Button className="w-full">Ajouter la tâche</Button>
                </form>
            </div>
        </div>
    )
}
