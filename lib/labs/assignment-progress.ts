import type { SubmissionStatus } from "@/lib/supabase/types";

type SubmissionSummary = { id: string; attempt_number: number; status: SubmissionStatus };

export function summarizeAttempts(submissions: SubmissionSummary[]) {
  const inProgress = submissions.find((s) => s.status === "in_progress") ?? null;
  const submitted = submissions
    .filter((s) => s.status === "submitted")
    .sort((a, b) => b.attempt_number - a.attempt_number);
  return {
    inProgress,
    submittedCount: submitted.length,
    latestSubmitted: submitted[0] ?? null,
  };
}

export function canStartNewAttempt({
  hasInProgress,
  submittedCount,
  allowMultipleAttempts,
  maxAttempts,
}: {
  hasInProgress: boolean;
  submittedCount: number;
  allowMultipleAttempts: boolean;
  maxAttempts: number | null;
}) {
  if (hasInProgress) return false;
  if (submittedCount === 0) return true;
  if (!allowMultipleAttempts) return false;
  if (maxAttempts === null) return true;
  return submittedCount < maxAttempts;
}
