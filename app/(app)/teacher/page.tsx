import Link from "next/link";
import { ChevronRight, ClipboardCheck, Plus, School2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LedgerTag } from "@/components/ui/ledger-tag";

export default async function TeacherHomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, description, join_code, archived_at, created_at")
    .eq("teacher_id", userData.user!.id)
    .order("created_at", { ascending: false });

  const classIds = (classes ?? []).map((c) => c.id);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const counts = new Map<string, number>();
  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .in("class_id", classIds);
    for (const row of enrollments ?? []) {
      counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1);
    }
  }
  const totalStudents = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);

  const { data: needsGradingRows } = classIds.length
    ? await supabase
        .from("gradebook_entries")
        .select("assignment_id, class_id, assignment_title")
        .is("grade_id", null)
        .eq("latest_submission_status", "submitted")
    : { data: [] };

  const needsGradingByAssignment = new Map<
    string,
    { assignmentId: string; classId: string; title: string; count: number }
  >();
  for (const row of needsGradingRows ?? []) {
    const existing = needsGradingByAssignment.get(row.assignment_id);
    if (existing) {
      existing.count += 1;
    } else {
      needsGradingByAssignment.set(row.assignment_id, {
        assignmentId: row.assignment_id,
        classId: row.class_id,
        title: row.assignment_title,
        count: 1,
      });
    }
  }
  const needsGrading = Array.from(needsGradingByAssignment.values()).sort((a, b) => b.count - a.count);
  const totalNeedsGrading = needsGrading.reduce((sum, n) => sum + n.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium">Your classes</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a class to get a join code and start assigning labs.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/classes/new">
            <Plus />
            New class
          </Link>
        </Button>
      </div>

      {classes && classes.length > 0 && (
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <div className="flex items-center gap-3 bg-card px-5 py-4">
            <School2 className="text-primary size-5" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-medium">{classes.length}</p>
              <p className="text-muted-foreground text-xs">Classes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card px-5 py-4">
            <Users className="text-primary size-5" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-medium">{totalStudents}</p>
              <p className="text-muted-foreground text-xs">Students</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card px-5 py-4">
            <ClipboardCheck className="text-primary size-5" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-medium">{totalNeedsGrading}</p>
              <p className="text-muted-foreground text-xs">Submissions to grade</p>
            </div>
          </div>
        </div>
      )}

      {needsGrading.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Needs grading</CardTitle>
            <CardDescription>Submitted attempts waiting for a grade, across every class.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {needsGrading.map((item) => (
              <Link
                key={item.assignmentId}
                href={`/teacher/classes/${item.classId}/assignments/${item.assignmentId}/gradebook`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm transition-colors"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{classNameById.get(item.classId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{item.count} to grade</Badge>
                  <ChevronRight className="text-muted-foreground size-4" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {!classes || classes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No classes yet</CardTitle>
            <CardDescription>Create your first class to get a shareable join code.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button asChild variant="outline">
              <Link href="/teacher/classes/new">
                <Plus />
                Create a class
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <Link key={klass.id} href={`/teacher/classes/${klass.id}`}>
              <Card className="h-full transition-colors hover:border-foreground/30">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{klass.name}</CardTitle>
                    {klass.archived_at && <Badge variant="secondary">Archived</Badge>}
                  </div>
                  {klass.description && (
                    <CardDescription className="line-clamp-2">{klass.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between pb-6">
                  <LedgerTag>{klass.join_code}</LedgerTag>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Users className="size-4" />
                    {counts.get(klass.id) ?? 0}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
