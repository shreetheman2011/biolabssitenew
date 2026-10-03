"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentFormOutput } from "@/lib/validation/assignments";
import type { AssignmentStatus } from "@/lib/supabase/types";

export type AssignmentActionResult = { error: string } | undefined;

export async function createAssignment(
  classId: string,
  values: AssignmentFormOutput,
  status: AssignmentStatus
): Promise<AssignmentActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    lab_template_id: values.labTemplateId,
    teacher_id: userData.user.id,
    title: values.title,
    instructions: values.instructions || null,
    due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null,
    allow_multiple_attempts: values.allowMultipleAttempts,
    max_attempts: values.allowMultipleAttempts ? values.maxAttempts ?? null : null,
    grading_type: values.gradingType,
    max_score: values.gradingType === "numeric" ? values.maxScore ?? null : null,
    rubric_criteria:
      values.gradingType === "rubric"
        ? values.rubricCriteria?.map((c, i) => ({
            id: `c${i + 1}`,
            label: c.label,
            max_points: c.maxPoints,
          })) ?? null
        : null,
    status,
  });

  if (error) {
    return { error: "Could not create the assignment. Try again." };
  }

  redirect(`/teacher/classes/${classId}`);
}

export async function updateAssignment(
  assignmentId: string,
  classId: string,
  values: AssignmentFormOutput,
  status: AssignmentStatus
): Promise<AssignmentActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase
    .from("assignments")
    .update({
      lab_template_id: values.labTemplateId,
      title: values.title,
      instructions: values.instructions || null,
      due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null,
      allow_multiple_attempts: values.allowMultipleAttempts,
      max_attempts: values.allowMultipleAttempts ? values.maxAttempts ?? null : null,
      grading_type: values.gradingType,
      max_score: values.gradingType === "numeric" ? values.maxScore ?? null : null,
      rubric_criteria:
        values.gradingType === "rubric"
          ? values.rubricCriteria?.map((c, i) => ({
              id: `c${i + 1}`,
              label: c.label,
              max_points: c.maxPoints,
            })) ?? null
          : null,
      status,
    })
    .eq("id", assignmentId);

  if (error) {
    return {
      error: error.message.includes("cannot change grading configuration")
        ? "Can't change grading after a student has been graded. Undo that change and try again."
        : "Could not save the assignment. Try again.",
    };
  }

  redirect(`/teacher/classes/${classId}`);
}
