"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LAB_REGISTRY, type LabSlug } from "@/lib/labs/registry";
import { LabShell } from "@/components/labs/lab-shell";
import { JournalPromptRenderer } from "@/components/labs/journal-prompt-renderer";
import { useAutosave } from "@/hooks/use-autosave";
import { saveProgress, submitAttempt } from "@/lib/actions/submissions";
import type { JournalResponses, JournalSchema, SubmissionStatus } from "@/lib/supabase/types";

export function AttemptRunner({
  submission,
  assignment,
  journalSchema,
  labSlug,
}: {
  submission: {
    id: string;
    attempt_number: number;
    status: SubmissionStatus;
    sim_state: Record<string, unknown>;
    journal_responses: JournalResponses;
  };
  assignment: {
    class_id: string;
    title: string;
    instructions: string | null;
    due_at: string | null;
    allow_multiple_attempts: boolean;
    max_attempts: number | null;
  };
  journalSchema: JournalSchema;
  labSlug: LabSlug;
}) {
  const router = useRouter();
  const readOnly = submission.status === "submitted";
  const [simState, setSimState] = useState<Record<string, unknown>>(submission.sim_state ?? {});
  const [journalResponses, setJournalResponses] = useState<JournalResponses>(
    submission.journal_responses ?? { version: 1, answers: {} }
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const persist = useCallback(
    (value: { simState: Record<string, unknown>; journalResponses: JournalResponses }) =>
      saveProgress(submission.id, value),
    [submission.id]
  );

  const saveStatus = useAutosave({ simState, journalResponses }, persist, {
    enabled: !readOnly,
  });

  const LabComponent = LAB_REGISTRY[labSlug];

  function handleSubmit() {
    setSubmitError(null);
    startSubmit(async () => {
      const result = await submitAttempt(submission.id);
      if (result?.error) {
        setSubmitError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleJournalResponseChange(promptId: string, value: JournalResponses["answers"][string]) {
    setJournalResponses((prev) => ({ ...prev, answers: { ...prev.answers, [promptId]: value } }));
  }

  const requiredPromptsAnswered = journalSchema.prompts
    .filter((p) => p.required)
    .every((p) => {
      const answer = journalResponses.answers[p.id];
      if (p.type === "table") return Array.isArray(answer) && answer.length > 0;
      return typeof answer === "string" && answer.trim().length > 0;
    });

  return (
    <LabShell
      title={assignment.title}
      instructions={assignment.instructions}
      dueAt={assignment.due_at}
      attemptNumber={submission.attempt_number}
      allowMultipleAttempts={assignment.allow_multiple_attempts}
      maxAttempts={assignment.max_attempts}
      status={submission.status}
      saveStatus={saveStatus}
      backHref={`/student/classes/${assignment.class_id}`}
      canSubmit={requiredPromptsAnswered}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <LabComponent
        simState={simState}
        onSimStateChange={setSimState}
        readOnly={readOnly}
        journalResponses={journalResponses}
        onJournalResponseChange={handleJournalResponseChange}
      />
      <JournalPromptRenderer
        schema={journalSchema}
        responses={journalResponses}
        onChange={setJournalResponses}
        readOnly={readOnly}
      />
    </LabShell>
  );
}
