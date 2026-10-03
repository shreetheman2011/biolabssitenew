"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { JournalPrompt, JournalResponses, JournalSchema } from "@/lib/supabase/types";

export function JournalPromptRenderer({
  schema,
  responses,
  onChange,
  readOnly,
}: {
  schema: JournalSchema;
  responses: JournalResponses;
  onChange: (next: JournalResponses) => void;
  readOnly: boolean;
}) {
  function setAnswer(promptId: string, value: JournalResponses["answers"][string]) {
    onChange({ ...responses, answers: { ...responses.answers, [promptId]: value } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab journal</CardTitle>
        <CardDescription>Answer every required question before submitting.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pb-6">
        {schema.prompts.map((prompt) => (
          <PromptField
            key={prompt.id}
            prompt={prompt}
            value={responses.answers[prompt.id]}
            onChange={(value) => setAnswer(prompt.id, value)}
            readOnly={readOnly}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function PromptField({
  prompt,
  value,
  onChange,
  readOnly,
}: {
  prompt: JournalPrompt;
  value: JournalResponses["answers"][string] | undefined;
  onChange: (value: JournalResponses["answers"][string]) => void;
  readOnly: boolean;
}) {
  const label = (
    <label className="text-sm font-medium">
      {prompt.label}
      {prompt.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  if (prompt.type === "short_text") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      </div>
    );
  }

  if (prompt.type === "long_text") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Textarea
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      </div>
    );
  }

  const columns = prompt.columns ?? [];
  const rows = (Array.isArray(value) ? value : []) as Record<string, string>[];

  function updateCell(rowIndex: number, column: string, cellValue: string) {
    onChange(rows.map((row, i) => (i === rowIndex ? { ...row, [column]: cellValue } : row)));
  }

  function addRow() {
    onChange([...rows, Object.fromEntries(columns.map((c) => [c, ""]))]);
  }

  function removeRow(rowIndex: number) {
    onChange(rows.filter((_, i) => i !== rowIndex));
  }

  return (
    <div className="flex flex-col gap-2">
      {label}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium capitalize">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-muted-foreground px-3 py-3 text-center text-xs">
                  No rows yet.
                </td>
              </tr>
            )}
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col} className="p-1.5">
                    <Input
                      className="h-8"
                      value={row[col] ?? ""}
                      onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                ))}
                {!readOnly && (
                  <td className="p-1.5">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(rowIndex)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
          <Plus />
          Add row
        </Button>
      )}
    </div>
  );
}
