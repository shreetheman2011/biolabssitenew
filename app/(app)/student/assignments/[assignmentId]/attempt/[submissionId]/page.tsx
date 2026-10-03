import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttemptRunner } from "./attempt-runner";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ assignmentId: string; submissionId: string }>;
}) {
  const { assignmentId, submissionId } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, assignment_id, attempt_number, status, sim_state, journal_responses")
    .eq("id", submissionId)
    .single();

  if (!submission || submission.assignment_id !== assignmentId) notFound();

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id, class_id, lab_template_id, title, instructions, due_at, allow_multiple_attempts, max_attempts"
    )
    .eq("id", assignmentId)
    .single();

  if (!assignment) notFound();

  const { data: labTemplate } = await supabase
    .from("lab_templates")
    .select("slug, default_journal_schema")
    .eq("id", assignment.lab_template_id)
    .single();

  if (!labTemplate) notFound();

  return (
    <AttemptRunner
      submission={submission}
      assignment={assignment}
      journalSchema={labTemplate.default_journal_schema}
      labSlug={labTemplate.slug}
    />
  );
}
