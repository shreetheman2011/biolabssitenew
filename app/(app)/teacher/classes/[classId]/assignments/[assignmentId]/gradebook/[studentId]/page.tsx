import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LedgerTag } from "@/components/ui/ledger-tag";
import { JournalPromptRenderer } from "@/components/labs/journal-prompt-renderer";
import { LAB_REGISTRY } from "@/lib/labs/registry";
import { GradingForm } from "./grading-form";

export default async function StudentGradingPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string; studentId: string }>;
}) {
  const { classId, assignmentId, studentId } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, grading_type, max_score, rubric_criteria, lab_template_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) notFound();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const { data: labTemplate } = await supabase
    .from("lab_templates")
    .select("slug, default_journal_schema")
    .eq("id", assignment.lab_template_id)
    .single();

  if (!labTemplate) notFound();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, attempt_number, status, sim_state, journal_responses, submitted_at")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false });

  const gradableSubmission = (submissions ?? []).find((s) => s.status === "submitted") ?? null;

  const { data: existingGrade } = await supabase
    .from("grades")
    .select("numeric_score, rubric_scores, feedback")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: roster } = await supabase
    .from("gradebook_entries")
    .select("student_id, student_name")
    .eq("assignment_id", assignmentId)
    .order("student_name", { ascending: true });

  const rosterIds = (roster ?? []).map((r) => r.student_id);
  const currentIndex = rosterIds.indexOf(studentId);
  const prevStudentId = currentIndex > 0 ? rosterIds[currentIndex - 1] : null;
  const nextStudentId = currentIndex >= 0 && currentIndex < rosterIds.length - 1 ? rosterIds[currentIndex + 1] : null;

  const LabComponent = LAB_REGISTRY[labTemplate.slug];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/teacher/classes/${classId}/assignments/${assignmentId}/gradebook`}
            className="text-muted-foreground flex items-center gap-1.5 text-sm hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to gradebook
          </Link>
          <h1 className="font-display text-2xl font-medium">{student.full_name}</h1>
          <p className="text-muted-foreground text-sm">{assignment.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              prevStudentId
                ? `/teacher/classes/${classId}/assignments/${assignmentId}/gradebook/${prevStudentId}`
                : "#"
            }
            aria-disabled={!prevStudentId}
            className={`flex items-center gap-1 text-sm ${prevStudentId ? "text-foreground hover:underline" : "text-muted-foreground/40 pointer-events-none"}`}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
          <Link
            href={
              nextStudentId
                ? `/teacher/classes/${classId}/assignments/${assignmentId}/gradebook/${nextStudentId}`
                : "#"
            }
            aria-disabled={!nextStudentId}
            className={`flex items-center gap-1 text-sm ${nextStudentId ? "text-foreground hover:underline" : "text-muted-foreground/40 pointer-events-none"}`}
          >
            Next
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {!gradableSubmission ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              {submissions && submissions.length > 0
                ? "This student has started the lab but hasn't submitted an attempt yet."
                : "This student hasn't started the lab yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <LedgerTag>Attempt {gradableSubmission.attempt_number}</LedgerTag>
            {gradableSubmission.submitted_at && (
              <span className="text-muted-foreground text-xs">
                Submitted {new Date(gradableSubmission.submitted_at).toLocaleString()}
              </span>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lab replay</CardTitle>
              <CardDescription>Exactly what the student left behind when they submitted.</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <LabComponent
                simState={gradableSubmission.sim_state}
                onSimStateChange={() => {}}
                readOnly
              />
            </CardContent>
          </Card>

          <JournalPromptRenderer
            schema={labTemplate.default_journal_schema}
            responses={gradableSubmission.journal_responses}
            onChange={() => {}}
            readOnly
          />

          <GradingForm
            assignmentId={assignmentId}
            classId={classId}
            studentId={studentId}
            submissionId={gradableSubmission.id}
            gradingType={assignment.grading_type}
            maxScore={assignment.max_score}
            rubricCriteria={assignment.rubric_criteria ?? []}
            existingGrade={existingGrade ?? null}
          />
        </>
      )}
    </div>
  );
}
