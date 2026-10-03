"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, JournalResponses } from "@/lib/supabase/types";

type SubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];

export type SubmissionActionResult = { error: string } | undefined;

export async function startOrResumeAttempt(
  assignmentId: string
): Promise<SubmissionActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userData.user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) {
    redirect(`/student/assignments/${assignmentId}/attempt/${existing.id}`);
  }

  const { data: priorAttempts } = await supabase
    .from("submissions")
    .select("attempt_number")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userData.user.id)
    .order("attempt_number", { ascending: false })
    .limit(1);

  const nextAttemptNumber = (priorAttempts?.[0]?.attempt_number ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("submissions")
    .insert({
      assignment_id: assignmentId,
      student_id: userData.user.id,
      attempt_number: nextAttemptNumber,
    })
    .select("id")
    .single();

  if (error || !created) {
    return {
      error: "This lab doesn't allow any more attempts for you.",
    };
  }

  redirect(`/student/assignments/${assignmentId}/attempt/${created.id}`);
}

// Thin wrapper so this can be bound directly as a <form action>, which requires a
// (formData) => void | Promise<void> signature. startOrResumeAttempt's return value (used
// by callers that want to surface the "no more attempts" error) isn't assignable to that.
export async function startOrResumeAttemptAction(assignmentId: string): Promise<void> {
  await startOrResumeAttempt(assignmentId);
}

export async function saveProgress(
  submissionId: string,
  values: { simState?: Record<string, unknown>; journalResponses?: JournalResponses }
): Promise<SubmissionActionResult> {
  const supabase = await createClient();
  const update: SubmissionUpdate = {};
  if (values.simState !== undefined) update.sim_state = values.simState;
  if (values.journalResponses !== undefined) update.journal_responses = values.journalResponses;

  const { error } = await supabase.from("submissions").update(update).eq("id", submissionId);
  if (error) return { error: "Could not save your progress." };
  return undefined;
}

export async function submitAttempt(submissionId: string): Promise<SubmissionActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submissionId);

  if (error) return { error: "Could not submit this lab. Try again." };
  return undefined;
}
