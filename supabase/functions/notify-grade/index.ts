// Triggered by a Supabase Database Webhook on INSERT/UPDATE of public.grades.
// Looks up the context for the grade with the service-role key (bypasses RLS, which is
// correct here since this is the trusted server actor), emails the student via Brevo, and
// logs the delivery attempt to grade_notifications for auditing/retry visibility.
//
// Deploy: supabase functions deploy notify-grade
// Secrets required (supabase secrets set ...): BREVO_API_KEY, BREVO_FROM_EMAIL, APP_BASE_URL
// Optional: BREVO_FROM_NAME (defaults to "Verdant Labs")
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically by the platform.
//
// Configure the Database Webhook (Supabase dashboard -> Database -> Webhooks) to call this
// function's URL on grades INSERT and UPDATE, with an HTTP header
// "Authorization: Bearer <service-role-key>" so the platform's built-in JWT verification
// passes without disabling it.

import { createClient } from "jsr:@supabase/supabase-js@2";

type GradeRecord = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_id: string;
  numeric_score: number | null;
  rubric_scores: Record<string, { points: number; comment?: string }> | null;
  feedback: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: GradeRecord | null;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.table !== "grades" || !payload.record || payload.type === "DELETE") {
    return new Response("Ignored", { status: 200 });
  }

  const grade = payload.record;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const brevoFromEmail = Deno.env.get("BREVO_FROM_EMAIL");
  const brevoFromName = Deno.env.get("BREVO_FROM_NAME") ?? "Verdant Labs";
  const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !brevoApiKey || !brevoFromEmail) {
    console.error("notify-grade: missing required secrets");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  async function logAttempt(status: "sent" | "failed", details: { providerMessageId?: string; error?: string }) {
    await supabase.from("grade_notifications").insert({
      grade_id: grade.id,
      status,
      provider_message_id: details.providerMessageId ?? null,
      error: details.error ?? null,
    });
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", grade.student_id)
    .single();

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("title, class_id, grading_type, max_score, rubric_criteria")
    .eq("id", grade.assignment_id)
    .single();

  if (studentError || assignmentError || !student || !assignment) {
    const error = `Could not load context: ${studentError?.message ?? assignmentError?.message ?? "missing row"}`;
    console.error("notify-grade:", error);
    await logAttempt("failed", { error });
    // Data-integrity problem, not a transient failure, so retrying won't help. Acknowledge so
    // the webhook doesn't retry indefinitely.
    return new Response("Logged failure", { status: 200 });
  }

  if (!student.email) {
    const error = "Student has no email on file";
    await logAttempt("failed", { error });
    return new Response("Logged failure", { status: 200 });
  }

  const { data: klass } = await supabase.from("classes").select("name").eq("id", assignment.class_id).single();

  let scoreLine: string;
  if (assignment.grading_type === "numeric") {
    scoreLine = `${grade.numeric_score ?? "N/A"} / ${assignment.max_score ?? "N/A"}`;
  } else {
    const criteria = assignment.rubric_criteria ?? [];
    const earned = criteria.reduce((sum: number, c: { id: string; max_points: number }) => {
      const entry = grade.rubric_scores?.[c.id];
      return sum + (entry?.points ?? 0);
    }, 0);
    const max = criteria.reduce((sum: number, c: { max_points: number }) => sum + c.max_points, 0);
    scoreLine = `${earned} / ${max}`;
  }

  const gradesUrl = appBaseUrl ? `${appBaseUrl}/student/grades` : null;

  const rubricRows =
    assignment.grading_type === "rubric"
      ? (assignment.rubric_criteria ?? [])
          .map((c: { id: string; label: string; max_points: number }) => {
            const entry = grade.rubric_scores?.[c.id];
            const comment = entry?.comment ? `<div style="color:#6b7280;font-size:13px;margin-top:2px;">${escapeHtml(entry.comment)}</div>` : "";
            return `<tr><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(c.label)}${comment}</td><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${entry?.points ?? 0} / ${c.max_points}</td></tr>`;
          })
          .join("")
      : "";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
      <h2 style="margin-bottom:4px;">New grade posted</h2>
      <p style="color:#4b5563;margin-top:0;">${escapeHtml(student.full_name)}, your work on <strong>${escapeHtml(assignment.title)}</strong>${klass ? ` in ${escapeHtml(klass.name)}` : ""} has been graded.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Score</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:600;">${scoreLine}</p>
      </div>
      ${rubricRows ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">${rubricRows}</table>` : ""}
      ${grade.feedback ? `<div style="margin-bottom:16px;"><p style="font-size:14px;color:#6b7280;margin:0 0 4px;">Feedback</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(grade.feedback)}</p></div>` : ""}
      ${gradesUrl ? `<a href="${gradesUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">View your grades</a>` : ""}
    </div>
  `;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: brevoFromName, email: brevoFromEmail },
        to: [{ email: student.email, name: student.full_name }],
        subject: `Graded: ${assignment.title}`,
        htmlContent: html,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      const error = `Brevo error ${res.status}: ${JSON.stringify(body)}`;
      console.error("notify-grade:", error);
      await logAttempt("failed", { error });
      return new Response("Email send failed", { status: 502 });
    }

    await logAttempt("sent", { providerMessageId: body.messageId });
    await supabase.from("grades").update({ notified_at: new Date().toISOString() }).eq("id", grade.id);

    return new Response("OK", { status: 200 });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error calling Brevo";
    console.error("notify-grade:", error);
    await logAttempt("failed", { error });
    return new Response("Email send failed", { status: 502 });
  }
});

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
