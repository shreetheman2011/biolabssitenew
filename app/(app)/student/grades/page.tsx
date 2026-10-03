import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LAB_ICONS } from "@/lib/labs/icons";

export default async function StudentGradesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const studentId = userData.user!.id;

  const { data: grades } = await supabase
    .from("grades")
    .select("id, assignment_id, numeric_score, rubric_scores, feedback, graded_at")
    .eq("student_id", studentId)
    .order("graded_at", { ascending: false });

  const assignmentIds = (grades ?? []).map((g) => g.assignment_id);

  const { data: assignments } = assignmentIds.length
    ? await supabase
        .from("assignments")
        .select("id, title, class_id, grading_type, max_score, rubric_criteria, lab_template_id")
        .in("id", assignmentIds)
    : { data: [] };

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const classIds = Array.from(new Set((assignments ?? []).map((a) => a.class_id)));

  const { data: classes } = classIds.length
    ? await supabase.from("classes").select("id, name").in("id", classIds)
    : { data: [] };
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const { data: labTemplates } = await supabase.from("lab_templates").select("id, slug");
  const labSlugById = new Map((labTemplates ?? []).map((l) => [l.id, l.slug]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Grades</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your graded labs across every class.</p>
      </div>

      {!grades || grades.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No grades yet</CardTitle>
            <CardDescription>Once a teacher grades one of your labs, it&apos;ll show up here.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {grades.map((g) => {
            const assignment = assignmentById.get(g.assignment_id);
            if (!assignment) return null;
            const slug = labSlugById.get(assignment.lab_template_id);
            const Icon = slug ? LAB_ICONS[slug] : null;

            let maxPoints = 0;
            let score = 0;
            if (assignment.grading_type === "numeric") {
              maxPoints = assignment.max_score ?? 0;
              score = g.numeric_score ?? 0;
            } else {
              const criteria = assignment.rubric_criteria ?? [];
              maxPoints = criteria.reduce((sum, c) => sum + c.max_points, 0);
              score = g.rubric_scores
                ? Object.values(g.rubric_scores).reduce((sum, s) => sum + s.points, 0)
                : 0;
            }

            return (
              <Card key={g.id}>
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="text-primary size-5 shrink-0" strokeWidth={1.5} />}
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {classNameById.get(assignment.class_id)}, graded{" "}
                          {new Date(g.graded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-sm">
                      {score}/{maxPoints}
                    </Badge>
                  </div>

                  {assignment.grading_type === "rubric" && g.rubric_scores && (
                    <div className="border-border flex flex-col gap-2 border-t pt-3">
                      {(assignment.rubric_criteria ?? []).map((c) => {
                        const entry = g.rubric_scores?.[c.id];
                        return (
                          <div key={c.id} className="flex items-start justify-between gap-3 text-sm">
                            <div>
                              <p>{c.label}</p>
                              {entry?.comment && (
                                <p className="text-muted-foreground text-xs">{entry.comment}</p>
                              )}
                            </div>
                            <span className="text-muted-foreground shrink-0">
                              {entry?.points ?? 0}/{c.max_points}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {g.feedback && (
                    <div className="border-border bg-muted/40 rounded-md border p-3 text-sm">
                      <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                        <span className="bg-primary size-1.5 rounded-full" />
                        Feedback
                      </p>
                      <p className="whitespace-pre-wrap">{g.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
