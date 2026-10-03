import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, grading_type, max_score, rubric_criteria")
    .eq("id", assignmentId)
    .single();

  if (!assignment) notFound();

  const { data: entries } = await supabase
    .from("gradebook_entries")
    .select(
      "student_id, student_name, student_email, attempt_count, latest_submission_status, latest_submitted_at, numeric_score, rubric_scores, graded_at"
    )
    .eq("assignment_id", assignmentId)
    .order("student_name", { ascending: true });

  const maxPoints =
    assignment.grading_type === "rubric"
      ? (assignment.rubric_criteria ?? []).reduce((sum, c) => sum + c.max_points, 0)
      : assignment.max_score;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">{assignment.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gradebook. {assignment.grading_type === "numeric" ? `Numeric out of ${maxPoints}` : `Rubric out of ${maxPoints} points`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>
            {entries?.length ?? 0} student{entries?.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {!entries || entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No students enrolled in this class yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submission status</TableHead>
                  <TableHead>Attempts submitted</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const score =
                    assignment.grading_type === "numeric"
                      ? entry.numeric_score
                      : entry.rubric_scores
                        ? Object.values(entry.rubric_scores).reduce((sum, s) => sum + s.points, 0)
                        : null;
                  const isGraded = score !== null && score !== undefined;
                  return (
                    <TableRow key={entry.student_id}>
                      <TableCell>
                        <p className="font-medium">{entry.student_name}</p>
                        <p className="text-muted-foreground text-xs">{entry.student_email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.latest_submission_status === "submitted"
                              ? "success"
                              : entry.latest_submission_status === "in_progress"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {entry.latest_submission_status === "submitted"
                            ? "Submitted"
                            : entry.latest_submission_status === "in_progress"
                              ? "In progress"
                              : "Not started"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.attempt_count}</TableCell>
                      <TableCell>
                        {isGraded ? (
                          <Badge variant="success">
                            {score}/{maxPoints}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/teacher/classes/${classId}/assignments/${assignmentId}/gradebook/${entry.student_id}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
