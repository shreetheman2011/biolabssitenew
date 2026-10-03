import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentForm } from "../../new/assignment-form";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  const supabase = await createClient();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .single();

  if (!klass) notFound();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("class_id", classId)
    .single();

  if (!assignment) notFound();

  const { data: labTemplates } = await supabase
    .from("lab_templates")
    .select("*")
    .order("category", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Edit lab for {klass.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {assignment.status === "draft"
            ? "Finish setting this up, then post it to the class when ready."
            : "Changes save immediately and are visible to students right away."}
        </p>
      </div>
      <AssignmentForm classId={classId} labTemplates={labTemplates ?? []} assignment={assignment} />
    </div>
  );
}
