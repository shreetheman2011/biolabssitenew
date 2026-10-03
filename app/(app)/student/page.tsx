import Link from "next/link";
import { ArrowRight, Clock, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LabActionButton } from "@/components/labs/lab-action-button";
import { LAB_ICONS } from "@/lib/labs/icons";
import { canStartNewAttempt, summarizeAttempts } from "@/lib/labs/assignment-progress";
import { cn } from "@/lib/utils";

export default async function StudentHomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const studentId = userData.user!.id;

  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", studentId);

  const classIds = (enrollments ?? []).map((e) => e.class_id);

  if (classIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-medium">Welcome</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Join a class with a code from your teacher to see your labs here.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No classes yet</CardTitle>
            <CardDescription>Enter a join code to get started.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button asChild>
              <Link href="/student/join">
                <UserPlus />
                Join a class
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .in("id", classIds);

  const teacherIds = Array.from(new Set((classes ?? []).map((c) => c.teacher_id)));
  const { data: teachers } = teacherIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", teacherIds)
    : { data: [] };
  const teacherNameById = new Map((teachers ?? []).map((t) => [t.id, t.full_name]));
  const classById = new Map((classes ?? []).map((c) => [c.id, c]));

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, class_id, title, due_at, lab_template_id, allow_multiple_attempts, max_attempts")
    .in("class_id", classIds)
    .eq("status", "posted");

  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const { data: labTemplates } = await supabase.from("lab_templates").select("id, slug, title");
  const labBySlugId = new Map((labTemplates ?? []).map((l) => [l.id, l]));

  const { data: submissions } = assignmentIds.length
    ? await supabase
        .from("submissions")
        .select("id, assignment_id, attempt_number, status")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const { data: grades } = assignmentIds.length
    ? await supabase.from("grades").select("assignment_id").eq("student_id", studentId).in("assignment_id", assignmentIds)
    : { data: [] };

  const gradedAssignmentIds = new Set((grades ?? []).map((g) => g.assignment_id));

  const upcoming = (assignments ?? [])
    .filter((a) => !gradedAssignmentIds.has(a.id))
    .map((a) => {
      const subs = (submissions ?? []).filter((s) => s.assignment_id === a.id);
      const { inProgress, submittedCount } = summarizeAttempts(subs);
      const canStart = canStartNewAttempt({
        hasInProgress: !!inProgress,
        submittedCount,
        allowMultipleAttempts: a.allow_multiple_attempts,
        maxAttempts: a.max_attempts,
      });
      const lab = labBySlugId.get(a.lab_template_id);
      const klass = classById.get(a.class_id);
      return { assignment: a, inProgress, submittedCount, canStart, lab, klass };
    })
    .sort((a, b) => {
      if (!a.assignment.due_at && !b.assignment.due_at) return 0;
      if (!a.assignment.due_at) return 1;
      if (!b.assignment.due_at) return -1;
      return new Date(a.assignment.due_at).getTime() - new Date(b.assignment.due_at).getTime();
    });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Upcoming labs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything posted and not yet graded, across all your classes.
        </p>
      </div>

      {upcoming.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
            <CardDescription>Nothing posted and ungraded right now, check back later.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border">
          {upcoming.map(({ assignment, inProgress, submittedCount, canStart, lab, klass }, index) => {
            const Icon = lab ? LAB_ICONS[lab.slug] : null;
            const overdue = assignment.due_at ? new Date(assignment.due_at) < new Date() : false;
            const statusLabel = inProgress
              ? "In progress"
              : submittedCount > 0
                ? "Submitted, awaiting grade"
                : "Not started";
            return (
              <div
                key={assignment.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 bg-card p-5",
                  index > 0 && "border-t border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="text-primary size-5 shrink-0" strokeWidth={1.5} />}
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-muted-foreground text-xs">{klass?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={inProgress ? "warning" : submittedCount > 0 ? "secondary" : "outline"}>
                    {statusLabel}
                  </Badge>
                  {assignment.due_at && (
                    <Badge variant={overdue ? "destructive" : "outline"} className="gap-1">
                      <Clock className="size-3" />
                      Due {new Date(assignment.due_at).toLocaleDateString()}
                    </Badge>
                  )}
                  {inProgress ? (
                    <LabActionButton assignmentId={assignment.id} label="Resume" />
                  ) : canStart ? (
                    <LabActionButton
                      assignmentId={assignment.id}
                      label={submittedCount > 0 ? "Try again" : "Start lab"}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">My classes</h2>
          <Link
            href="/student/join"
            className="text-muted-foreground flex items-center gap-1 text-sm hover:text-foreground"
          >
            Join another
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(classes ?? []).map((c) => (
            <Link key={c.id} href={`/student/classes/${c.id}`}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="py-5">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Taught by {teacherNameById.get(c.teacher_id) ?? "unassigned"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
