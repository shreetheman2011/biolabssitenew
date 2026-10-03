import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/get-base-url";
import { Button } from "@/components/ui/button";
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
import { CopyField } from "@/components/copy-field";
import { LedgerTag } from "@/components/ui/ledger-tag";
import { LAB_ICONS } from "@/lib/labs/icons";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, description, join_code, archived_at, created_at")
    .eq("id", classId)
    .single();

  if (!klass) notFound();

  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, enrolled_at")
    .eq("class_id", classId)
    .order("enrolled_at", { ascending: true });

  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  const profilesById = new Map<string, { full_name: string; email: string }>();
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    for (const p of profiles ?? []) {
      profilesById.set(p.id, { full_name: p.full_name, email: p.email });
    }
  }

  const baseUrl = await getBaseUrl();
  const joinLink = `${baseUrl}/join/${klass.join_code}`;

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, title, status, due_at, grading_type, max_score, rubric_criteria, lab_template_id, created_at"
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  const { data: labTemplates } = await supabase.from("lab_templates").select("id, slug");
  const labSlugById = new Map((labTemplates ?? []).map((l) => [l.id, l.slug]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-medium">{klass.name}</h1>
        {klass.archived_at && <Badge variant="secondary">Archived</Badge>}
      </div>
      {klass.description && <p className="text-muted-foreground">{klass.description}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Invite students</CardTitle>
          <CardDescription>Share either the code or the link, both enroll a student instantly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6 sm:flex-row">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Join code</span>
            <LedgerTag className="text-sm">{klass.join_code}</LedgerTag>
          </div>
          <div className="flex-[2]">
            <CopyField label="Join link" value={joinLink} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>
            {enrollments?.length ?? 0} student{enrollments?.length === 1 ? "" : "s"} enrolled
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {!enrollments || enrollments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No students yet. Share the join code or link above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => {
                  const profile = profilesById.get(e.student_id);
                  return (
                    <TableRow key={e.student_id}>
                      <TableCell className="font-medium">{profile?.full_name ?? "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground">{profile?.email ?? "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground text-right">
                        {new Date(e.enrolled_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Post one of the four labs to this class.</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={`/teacher/classes/${classId}/assignments/new`}>
                <Plus />
                Post a lab
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {!assignments || assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing posted yet. Pick a lab to assign it to this class.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lab</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grading</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const slug = labSlugById.get(a.lab_template_id);
                  const Icon = slug ? LAB_ICONS[slug] : null;
                  const grading =
                    a.grading_type === "numeric"
                      ? `Numeric, out of ${a.max_score}`
                      : `Rubric, ${a.rubric_criteria?.length ?? 0} criteria`;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="flex items-center gap-2 font-medium">
                        {Icon && <Icon className="text-primary size-4" />}
                        {a.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "posted" ? "success" : "secondary"}>
                          {a.status === "posted" ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{grading}</TableCell>
                      <TableCell className="text-muted-foreground text-right">
                        {a.due_at ? new Date(a.due_at).toLocaleDateString() : "No due date"}
                      </TableCell>
                      <TableCell>
                        {a.status === "posted" && (
                          <Link
                            href={`/teacher/classes/${classId}/assignments/${a.id}/gradebook`}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
                          >
                            Gradebook
                            <ChevronRight className="size-3.5" />
                          </Link>
                        )}
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
