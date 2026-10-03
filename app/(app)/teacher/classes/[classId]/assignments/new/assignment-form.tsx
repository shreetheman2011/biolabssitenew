"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  assignmentFormSchema,
  type AssignmentFormInput,
  type AssignmentFormOutput,
} from "@/lib/validation/assignments";
import { createAssignment } from "@/lib/actions/assignments";
import { LAB_ICONS } from "@/lib/labs/icons";
import type { AssignmentStatus } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

type LabTemplateRow = Database["public"]["Tables"]["lab_templates"]["Row"];

export function AssignmentForm({
  classId,
  labTemplates,
}: {
  classId: string;
  labTemplates: LabTemplateRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<AssignmentStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AssignmentFormInput, undefined, AssignmentFormOutput>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      labTemplateId: "",
      title: "",
      instructions: "",
      dueAt: "",
      allowMultipleAttempts: false,
      maxAttempts: "",
      gradingType: "numeric",
      maxScore: "",
      rubricCriteria: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rubricCriteria",
  });

  const allowMultipleAttempts = form.watch("allowMultipleAttempts");
  const gradingType = form.watch("gradingType");
  const rubricRows = form.watch("rubricCriteria");
  const totalRubricPoints = (rubricRows ?? []).reduce((sum, row) => {
    const points = typeof row.maxPoints === "string" ? Number(row.maxPoints) : row.maxPoints;
    return sum + (Number.isFinite(points) ? Number(points) : 0);
  }, 0);

  function submitAs(status: AssignmentStatus) {
    void form.handleSubmit((data) => {
      setFormError(null);
      setPendingStatus(status);
      startTransition(async () => {
        const result = await createAssignment(classId, data, status);
        if (result?.error) {
          setFormError(result.error);
          setPendingStatus(null);
        }
      });
    })();
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-8">
        <FormField
          control={form.control}
          name="labTemplateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose a lab</FormLabel>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  {labTemplates.map((lab) => {
                    const Icon = LAB_ICONS[lab.slug];
                    const selected = field.value === lab.id;
                    return (
                      <button
                        key={lab.id}
                        type="button"
                        onClick={() => {
                          field.onChange(lab.id);
                          if (!form.getValues("title")) {
                            form.setValue("title", lab.title);
                          }
                        }}
                        className={cn(
                          "flex flex-col gap-2 rounded-lg border border-input p-4 text-left transition-colors hover:bg-muted",
                          selected && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="text-primary size-5" />
                          <span className="text-muted-foreground text-xs">
                            {lab.estimated_minutes} min
                          </span>
                        </div>
                        <p className="font-display text-sm font-medium">{lab.title}</p>
                        <p className="text-muted-foreground text-xs">{lab.summary}</p>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment title</FormLabel>
                <FormControl>
                  <Input placeholder="Lab title shown to students" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Any notes for students before they start, optional." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>Leave blank if there&apos;s no deadline.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <FormField
            control={form.control}
            name="allowMultipleAttempts"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4">
                <div>
                  <FormLabel>Allow multiple attempts</FormLabel>
                  <FormDescription>Students can retry the lab if this is on.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          {allowMultipleAttempts && (
            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Leave blank for unlimited"
                      {...field}
                      value={(field.value as string) ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <FormLabel>Grading</FormLabel>
          <FormField
            control={form.control}
            name="gradingType"
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={field.onChange}>
                <TabsList>
                  <TabsTrigger value="numeric">Numeric score</TabsTrigger>
                  <TabsTrigger value="rubric">Rubric</TabsTrigger>
                </TabsList>
                <TabsContent value="numeric" className="pt-2">
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field: scoreField }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>Max score</FormLabel>
                        <FormControl>
                          <Input
                          type="number"
                          min={1}
                          step="0.5"
                          placeholder="e.g. 100"
                          {...scoreField}
                          value={(scoreField.value as string) ?? ""}
                        />
                        </FormControl>
                        <FormDescription>Choose any scale, points, percent, whatever you use.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="rubric" className="flex flex-col gap-3 pt-2">
                  {fields.length === 0 && gradingType === "rubric" && (
                    <p className="text-muted-foreground text-sm">
                      Add at least one criterion to continue.
                    </p>
                  )}
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`rubricCriteria.${index}.label`}
                        render={({ field: labelField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Criterion, e.g. Hypothesis clarity" {...labelField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`rubricCriteria.${index}.maxPoints`}
                        render={({ field: pointsField }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Points"
                                {...pointsField}
                                value={(pointsField.value as string) ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label="Remove criterion"
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ label: "", maxPoints: "" })}
                    >
                      <Plus />
                      Add criterion
                    </Button>
                    {fields.length > 0 && (
                      <span className="text-muted-foreground text-sm">
                        {totalRubricPoints} point{totalRubricPoints === 1 ? "" : "s"} total
                      </span>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          />
          <p className="text-muted-foreground text-xs">
            Written feedback is always available when grading, for either mode.
          </p>
        </div>

        {formError && <p className="text-destructive text-sm">{formError}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => submitAs("draft")}>
            {isPending && pendingStatus === "draft" && <Loader2 className="animate-spin" />}
            Save as draft
          </Button>
          <Button type="button" disabled={isPending} onClick={() => submitAs("posted")}>
            {isPending && pendingStatus === "posted" && <Loader2 className="animate-spin" />}
            Post to class
          </Button>
        </div>
      </form>
    </Form>
  );
}
