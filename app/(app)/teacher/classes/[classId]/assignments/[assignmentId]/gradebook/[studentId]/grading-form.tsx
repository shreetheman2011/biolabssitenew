"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveGrade } from "@/lib/actions/grades";
import type { GradingType, RubricCriterion, RubricScores } from "@/lib/supabase/types";

export function GradingForm({
  assignmentId,
  classId,
  studentId,
  submissionId,
  gradingType,
  maxScore,
  rubricCriteria,
  existingGrade,
}: {
  assignmentId: string;
  classId: string;
  studentId: string;
  submissionId: string;
  gradingType: GradingType;
  maxScore: number | null;
  rubricCriteria: RubricCriterion[];
  existingGrade: { numeric_score: number | null; rubric_scores: RubricScores | null; feedback: string | null } | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [numericScore, setNumericScore] = useState(
    existingGrade?.numeric_score !== null && existingGrade?.numeric_score !== undefined
      ? String(existingGrade.numeric_score)
      : ""
  );
  const [rubricValues, setRubricValues] = useState<Record<string, { points: string; comment: string }>>(() => {
    const initial: Record<string, { points: string; comment: string }> = {};
    for (const criterion of rubricCriteria) {
      const existing = existingGrade?.rubric_scores?.[criterion.id];
      initial[criterion.id] = {
        points: existing ? String(existing.points) : "",
        comment: existing?.comment ?? "",
      };
    }
    return initial;
  });
  const [feedback, setFeedback] = useState(existingGrade?.feedback ?? "");

  const rubricTotal = rubricCriteria.reduce((sum, c) => {
    const v = Number(rubricValues[c.id]?.points);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
  const rubricMax = rubricCriteria.reduce((sum, c) => sum + c.max_points, 0);

  function handleSave() {
    let numericValue: number | null = null;
    let rubricScores: RubricScores | null = null;

    if (gradingType === "numeric") {
      const parsed = Number(numericScore);
      if (numericScore.trim() === "" || !Number.isFinite(parsed)) {
        toast.error("Enter a valid numeric score.");
        return;
      }
      numericValue = Math.max(0, maxScore !== null ? Math.min(parsed, maxScore) : parsed);
    } else {
      rubricScores = {};
      for (const criterion of rubricCriteria) {
        const raw = rubricValues[criterion.id]?.points ?? "";
        const parsed = Number(raw);
        if (raw.trim() === "" || !Number.isFinite(parsed)) {
          toast.error(`Enter a score for "${criterion.label}".`);
          return;
        }
        rubricScores[criterion.id] = {
          points: Math.max(0, Math.min(parsed, criterion.max_points)),
          comment: rubricValues[criterion.id]?.comment || undefined,
        };
      }
    }

    startTransition(async () => {
      const result = await saveGrade({
        assignmentId,
        classId,
        studentId,
        submissionId,
        numericScore: numericValue,
        rubricScores,
        feedback: feedback.trim() || null,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Grade saved. The student will be notified by email.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade this attempt</CardTitle>
        <CardDescription>
          {gradingType === "numeric"
            ? `Enter a score out of ${maxScore}.`
            : `Score each rubric criterion. Total: ${rubricTotal}/${rubricMax}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pb-6">
        {gradingType === "numeric" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="numeric-score">Score</Label>
            <div className="flex items-center gap-2">
              <Input
                id="numeric-score"
                type="number"
                min={0}
                max={maxScore ?? undefined}
                value={numericScore}
                onChange={(e) => setNumericScore(e.target.value)}
                className="w-32"
              />
              <span className="text-muted-foreground text-sm">/ {maxScore}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rubricCriteria.map((criterion) => (
              <div key={criterion.id} className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`rubric-${criterion.id}`}>{criterion.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`rubric-${criterion.id}`}
                      type="number"
                      min={0}
                      max={criterion.max_points}
                      value={rubricValues[criterion.id]?.points ?? ""}
                      onChange={(e) =>
                        setRubricValues((prev) => ({
                          ...prev,
                          [criterion.id]: { ...prev[criterion.id], points: e.target.value },
                        }))
                      }
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">/ {criterion.max_points}</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Comment on this criterion (optional)"
                  value={rubricValues[criterion.id]?.comment ?? ""}
                  onChange={(e) =>
                    setRubricValues((prev) => ({
                      ...prev,
                      [criterion.id]: { ...prev[criterion.id], comment: e.target.value },
                    }))
                  }
                  className="min-h-16"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="feedback">Overall feedback</Label>
          <Textarea
            id="feedback"
            placeholder="Written feedback for the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : existingGrade ? "Update grade" : "Save grade"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
