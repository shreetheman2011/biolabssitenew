import { z } from "zod";

// Normalizes a text-input's raw string ("" when empty) to `undefined` before any numeric
// schema runs, so "leave blank for unlimited/none" fields validate cleanly as optional.
function blankToUndefined(val: unknown) {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export const rubricCriterionInputSchema = z.object({
  label: z.string().trim().min(1, "Enter a criterion label").max(120),
  maxPoints: z.preprocess(
    blankToUndefined,
    z.number({ message: "Enter points" }).positive("Must be greater than 0")
  ),
});

export const assignmentFormSchema = z
  .object({
    labTemplateId: z.string().min(1, "Choose a lab"),
    title: z.string().trim().min(2, "Title is required").max(150, "Keep it under 150 characters"),
    instructions: z.string().trim().max(2000, "Keep it under 2000 characters").optional(),
    dueAt: z.string().optional(),
    allowMultipleAttempts: z.boolean(),
    maxAttempts: z.preprocess(
      blankToUndefined,
      z.number().int("Must be a whole number").positive("Must be greater than 0").optional()
    ),
    gradingType: z.enum(["numeric", "rubric"]),
    maxScore: z.preprocess(
      blankToUndefined,
      z.number().positive("Must be greater than 0").optional()
    ),
    rubricCriteria: z.array(rubricCriterionInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.gradingType === "numeric" && data.maxScore === undefined) {
      ctx.addIssue({ code: "custom", path: ["maxScore"], message: "Enter a max score" });
    }
    if (data.gradingType === "rubric" && (!data.rubricCriteria || data.rubricCriteria.length === 0)) {
      ctx.addIssue({ code: "custom", path: ["rubricCriteria"], message: "Add at least one rubric criterion" });
    }
  });

export type AssignmentFormInput = z.input<typeof assignmentFormSchema>;
export type AssignmentFormOutput = z.output<typeof assignmentFormSchema>;
