import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentForm } from "./assignment-form";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .single();

  if (!klass) notFound();

  const { data: labTemplates } = await supabase
    .from("lab_templates")
    .select("*")
    .order("category", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Post a lab to {klass.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a lab, set the due date and attempt policy, and pick how you&apos;ll grade it.
        </p>
      </div>
      <AssignmentForm classId={classId} labTemplates={labTemplates ?? []} />
    </div>
  );
}
