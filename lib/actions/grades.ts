"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RubricScores } from "@/lib/supabase/types";

export type GradeActionResult = { error: string } | { success: true };

export async function saveGrade(input: {
  assignmentId: string;
  classId: string;
  studentId: string;
  submissionId: string;
  numericScore: number | null;
  rubricScores: RubricScores | null;
  feedback: string | null;
}): Promise<GradeActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated." };

  const { error } = await supabase.from("grades").upsert(
    {
      assignment_id: input.assignmentId,
      student_id: input.studentId,
      submission_id: input.submissionId,
      graded_by: userData.user.id,
      numeric_score: input.numericScore,
      rubric_scores: input.rubricScores,
      feedback: input.feedback,
    },
    { onConflict: "submission_id" }
  );

  if (error) return { error: "Could not save the grade. Try again." };

  revalidatePath(`/teacher/classes/${input.classId}/assignments/${input.assignmentId}/gradebook`);
  revalidatePath(`/student/classes/${input.classId}`);
  revalidatePath("/student/grades");
  revalidatePath("/student");
  return { success: true };
}
