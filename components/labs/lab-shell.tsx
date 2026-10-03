"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgerTag } from "@/components/ui/ledger-tag";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { SaveStatus } from "@/hooks/use-autosave";
import type { SubmissionStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2 className="size-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-destructive flex items-center gap-1.5 text-xs">
        <CloudOff className="size-3.5" />
        Couldn&apos;t save, check your connection
      </span>
    );
  }
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Cloud className="size-3.5" />
      Saved
    </span>
  );
}

export function LabShell({
  title,
  instructions,
  dueAt,
  attemptNumber,
  allowMultipleAttempts,
  maxAttempts,
  status,
  saveStatus,
  backHref,
  canSubmit,
  isSubmitting,
  submitError,
  onSubmit,
  children,
}: {
  title: string;
  instructions: string | null;
  dueAt: string | null;
  attemptNumber: number;
  allowMultipleAttempts: boolean;
  maxAttempts: number | null;
  status: SubmissionStatus;
  saveStatus: SaveStatus;
  backHref: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const attemptLabel = allowMultipleAttempts
    ? `Attempt ${attemptNumber}${maxAttempts ? ` of ${maxAttempts}` : ""}`
    : "Single attempt";
  const isInProgress = status === "in_progress";

  return (
    <div className={cn("flex flex-col gap-6", isInProgress && "pb-24")}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href={backHref}
            className="text-muted-foreground flex items-center gap-1.5 text-sm hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to class
          </Link>
          <h1 className="font-display text-2xl font-medium">{title}</h1>
          {instructions && <p className="text-muted-foreground max-w-2xl text-sm">{instructions}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <LedgerTag>{attemptLabel}</LedgerTag>
            {dueAt && (
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" />
                Due {new Date(dueAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
      </div>

      {status === "submitted" && (
        <div className="flex items-center gap-2 rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          Submitted. This attempt is locked and ready for grading.
        </div>
      )}

      <div className="flex flex-col gap-8">{children}</div>

      {isInProgress && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-muted-foreground text-xs">
              {submitError ? (
                <span className="text-destructive">{submitError}</span>
              ) : (
                "Submitting locks this attempt, you won't be able to edit it after."
              )}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Submit lab
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit this attempt?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once submitted, you won&apos;t be able to change your answers. Your teacher
                    will be able to grade it right away.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep working</AlertDialogCancel>
                  <AlertDialogAction onClick={onSubmit}>Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
