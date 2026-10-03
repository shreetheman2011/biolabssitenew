import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabActionButton } from "@/components/labs/lab-action-button";
import { LAB_ICONS } from "@/lib/labs/icons";
import { canStartNewAttempt, summarizeAttempts } from "@/lib/labs/assignment-progress";
import { cn } from "@/lib/utils";

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const studentId = userData.user!.id;

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, description, teacher_id")
    .eq("id", classId)
    .single();

  if (!klass) notFound();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", klass.teacher_id)
    .single();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, title, due_at, lab_template_id, allow_multiple_attempts, max_attempts, grading_type, max_score, rubric_criteria"
    )
    .eq("class_id", classId)
    .eq("status", "posted")
    .order("due_at", { ascending: true, nullsFirst: false });

  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const { data: labTemplates } = await supabase.from("lab_templates").select("id, slug");
  const labSlugById = new Map((labTemplates ?? []).map((l) => [l.id, l.slug]));

  const { data: submissions } = assignmentIds.length
    ? await supabase
        .from("submissions")
        .select("id, assignment_id, attempt_number, status")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const { data: grades } = assignmentIds.length
    ? await supabase
        .from("grades")
        .select("assignment_id, numeric_score, rubric_scores")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const gradeByAssignmentId = new Map((grades ?? []).map((g) => [g.assignment_id, g]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">{klass.name}</h1>
        {teacher && <p className="text-muted-foreground mt-1 text-sm">Taught by {teacher.full_name}</p>}
      </div>
      {klass.description && <p className="text-muted-foreground">{klass.description}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Labs your teacher has posted to this class.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {!assignments || assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing posted yet, check back soon.</p>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-lg border border-border">
              {assignments.map((a, index) => {
                const slug = labSlugById.get(a.lab_template_id);
                const Icon = slug ? LAB_ICONS[slug] : null;
                const subs = (submissions ?? []).filter((s) => s.assignment_id === a.id);
                const { inProgress, submittedCount } = summarizeAttempts(subs);
                const grade = gradeByAssignmentId.get(a.id);
                const canStart = canStartNewAttempt({
                  hasInProgress: !!inProgress,
                  submittedCount,
                  allowMultipleAttempts: a.allow_multiple_attempts,
                  maxAttempts: a.max_attempts,
                });
                const overdue = a.due_at ? new Date(a.due_at) < new Date() : false;

                let maxPoints: number | null = null;
                let score: number | null = null;
                if (grade) {
                  if (a.grading_type === "numeric") {
                    maxPoints = a.max_score;
                    score = grade.numeric_score;
                  } else {
                    const criteria = a.rubric_criteria ?? [];
                    maxPoints = criteria.reduce((sum, c) => sum + c.max_points, 0);
                    score = grade.rubric_scores
                      ? Object.values(grade.rubric_scores).reduce((sum, s) => sum + s.points, 0)
                      : null;
                  }
                }

                const statusLabel = grade
                  ? "Graded"
                  : inProgress
                    ? "In progress"
                    : submittedCount > 0
                      ? "Submitted, awaiting grade"
                      : "Not started";

                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 bg-card p-4",
                      index > 0 && "border-t border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="text-primary size-5 shrink-0" strokeWidth={1.5} />}
                      <div>
                        <p className="font-medium">{a.title}</p>
                        {a.due_at && (
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            Due {new Date(a.due_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {grade ? (
                        <Badge variant="success">
                          {score}/{maxPoints}
                        </Badge>
                      ) : (
                        <Badge variant={inProgress ? "warning" : submittedCount > 0 ? "secondary" : "outline"}>
                          {statusLabel}
                        </Badge>
                      )}
                      {!grade && overdue && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                      {grade ? (
                        <Link href="/student/grades" className="text-muted-foreground text-xs hover:text-foreground">
                          View feedback
                        </Link>
                      ) : inProgress ? (
                        <LabActionButton assignmentId={a.id} label="Resume" />
                      ) : canStart ? (
                        <LabActionButton
                          assignmentId={a.id}
                          label={submittedCount > 0 ? "Try again" : "Start lab"}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
